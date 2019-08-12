/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';
import { Utils } from '../Utils';
import { RhamtConfiguration } from '../model/model';
import { RhamtRunner } from './rhamtRunner';
import { RhamtProcessController } from './rhamtProcessController';
import { ProgressMonitor } from './progressMonitor';
import * as path from 'path';
import { AnalysisResultsUtil, AnalysisResultsSummary, AnalysisResults } from '../model/analysisResults';
import { ModelService } from '../model/modelService';
const PROGRESS = ':progress:';
const START_TIMEOUT = 60000;

class RhamtChannelImpl {
    private readonly channel: vscode.OutputChannel = vscode.window.createOutputChannel('RHAMT');
    print(text: string) {
        this.channel.append(text);
        this.channel.show();
    }
    clear() {
        this.channel.clear();
    }
}

export const rhamtChannel = new RhamtChannelImpl();

export class RhamtUtil {

    static async analyze(config: RhamtConfiguration, modelService: ModelService): Promise<RhamtProcessController> {
        try {
            await Utils.initConfiguration(config, modelService);
        } catch (e) {
            return Promise.reject(e);
        }

        return vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            cancellable: true
        }, async (progress: any, token: any) => {
            return new Promise<any>(async resolve => {
                let executable: any;
                try {
                    executable = await Utils.findRhamtCli(modelService.outDir);
                }
                catch (e) {
                    vscode.window.showErrorMessage(`Error finding rhamt-cli: ${e}`);
                    return Promise.reject(e);
                }
                const windupHome = path.resolve(executable, '..', '..');
                let params = [];
                try {
                    params = await RhamtUtil.buildParams(config, windupHome);
                }
                catch (e) {
                    vscode.window.showErrorMessage(`Error: ${e}`);
                    return Promise.reject(e);
                }
                rhamtChannel.clear();
                progress.report({message: 'Executing rhamt-cli script...'});
                let cancelled = false;
                let resolved = false;
                let processController: RhamtProcessController;
                const date = new Date();
                const time = date.toLocaleTimeString();
                const timestamp = time.substring(0, time.lastIndexOf(':'));
                const sun = time.substring(time.lastIndexOf(' ') + 1);
                const year = new String(date.getFullYear()).substring(0, 2);
                const executedTimestamp = `${date.getMonth()}/${date.getDate()}/${year} @ ${timestamp}${sun}`;
                const onComplete = async () => {
                    processController.shutdown();
                    vscode.window.showInformationMessage('Analysis complete', 'Open Report').then(result => {
                        if (result === 'Open Report') {
                            AnalysisResultsUtil.openReport(config.getReport());
                        }
                    });
                    try {
                        console.log(`Analysis complete. Loading results.`);
                        await this.loadResults(config, modelService, executedTimestamp);
                    }
                    catch (e) {
                        console.log(`Error loading analysis results: ${e}`);
                        vscode.window.showErrorMessage(e);
                    }
                    if (!resolved) {
                        resolve();
                    }
                };
                const monitor = new ProgressMonitor(progress, onComplete);
                const onMessage = (data: string) => {
                    if (data.includes(PROGRESS)) {
                        const trimmed = data.trim();
                        const split = trimmed.split(PROGRESS);
                        split.forEach(element => {
                            if (element) {
                                const raw = element.replace(PROGRESS, '').trim();
                                try {
                                    const json = JSON.parse(raw);
                                    monitor.handleMessage(json);
                                }
                                catch (e) {
                                    console.log(`Error parsing data: ${raw}`);
                                    console.log(`Error parsing raw: ${raw}`);
                                    console.log(`Error: ${e}`);
                                }
                            }
                        });
                    }
                    else {
                        data = data.trim();
                        if (data && data.length > 1) {
                            rhamtChannel.print(data);
                        }
                    }
                };
                const onShutdown = () => {
                    console.log('rhamt-cli shutdown');
                    if (!resolved) {
                        resolved = true;
                        resolve();
                    }
                };
                try {
                    console.log(`Executing RHAMT using params: ${params.join(' ')}`);
                    processController = await RhamtRunner.run(config.rhamtExecutable, params, START_TIMEOUT, onMessage).then(cp => {
                        config.results = undefined;
                        return new RhamtProcessController(config.rhamtExecutable, cp, onShutdown);
                    });
                    if (cancelled) {
                        console.log('rhamt-cli was cancelled during startup.');
                        processController.shutdown();
                        return;
                    }
                } catch (e) {
                    console.log(e);
                    progress.report({message: `Error: ${e}`});
                    return Promise.reject();
                }
                token.onCancellationRequested(() => {
                    cancelled = true;
                    if (processController) {
                        processController.shutdown();
                    }
                    if (!resolved) {
                        resolved = true;
                        resolve();
                    }
                });
                progress.report({ message: 'Preparing analysis configuration...' });
            });
        });
    }

    private static buildParams(config: RhamtConfiguration, windupHome: string): Promise<any[]> {
        const params = [];
        params.push('--toolingMode');
        params.push('--input');
        const input = config.options['input'];
        if (!input || input.length === 0) {
            return Promise.reject('input is missing from configuration');
        }
        params.push(input);
        params.push('--output');
        const output = config.options['output'];
        if (!output || output === '') {
            return Promise.reject('output is missing from configuration');
        }
        params.push(output);
        params.push('--sourceMode');
        params.push('--ignorePattern');
        params.push('\\.class$');
        params.push('--windupHome');
        params.push(windupHome);
        const source = config.options['source'];
        if (source && source.length > 0) {
            params.push('--source');
            params.push(source.join(' '));
        }
        let target = config.options['target'];
        if (!target) {
            target = [];
        }
        if (target.length === 0) {
            target.push('eap7');
        }
        params.push('--target');
        params.push(target.join(' '));

        let rules = config.options['userRulesDirectory'];
        if (rules && rules.length > 0) {
            params.push('--userRulesDirectory');
            params.push(rules.join(' '));
        }

        return Promise.resolve(params);
    }

    private static async loadResults(config: RhamtConfiguration, modelService: ModelService, startedTimestamp: string): Promise<any> {
        try {
            const dom = await AnalysisResultsUtil.loadFromLocation(config.getResultsLocation());
            const summary: AnalysisResultsSummary = {
                outputLocation: config.options['output'],
                executedTimestamp: startedTimestamp,
                executable: config.rhamtExecutable
            };
            config.summary = summary;
            config.results = new AnalysisResults(config, dom);
        }
        catch (e) {
            return Promise.reject(`Error loading analysis results from (${config.getResultsLocation()}): ${e}`);
        }
        try {
            modelService.save();
        }
        catch (e) {
            console.log(`Error saving analysis results: ${e}`);
            return Promise.reject(`Error saving analysis results: ${e}`);
        }
    }
}