/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';
import { RhamtProcessController } from './rhamtProcessController';
import { ModelService } from '../model/modelService';
import { rhamtChannel } from '../util/console';
import * as fs from 'fs-extra';
import { DataProvider } from '../tree/dataProvider';
import { AnalyzerRunner } from './analyzerRunner';
import { AnalyzerProcessController } from './analyzerProcessController';
import { RhamtConfiguration, WINDOW } from './analyzerModel';
import * as path from 'path';
import { AnalyzerResults } from './analyzerResults';
import { AnalyzerProgressMonitor } from './analyzerProgressMonitor';
const START_TIMEOUT = 60000;

export class AnalyzerUtil {

    static async analyze(dataProvider: DataProvider, config: RhamtConfiguration, modelService: ModelService, onStarted: () => void, onComplete: () => void): Promise<RhamtProcessController> {
        let cli = undefined;
        try {
            const configCli = config.options['cli'] as string;
            if (configCli) {
                cli = configCli.trim();
            }
            else {
                const analyzerPath = vscode.workspace.getConfiguration('cli.executable').get<string>('path');
                if (analyzerPath) {
                    console.log(`preference cli.executable.path found - ${analyzerPath}`);
                    cli = analyzerPath;
                }
            }
        } catch (e) {
            return Promise.reject(e);
        }

        if (!cli) {
            return Promise.reject('Cannot find analyzer executable path.');
        }

        config.rhamtExecutable = cli;

        return vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            cancellable: true
        }, async (progress: any, token: vscode.CancellationToken) => {
            return new Promise<any>(async resolve => {
                const executable = config.rhamtExecutable;
                console.log(`Using executable - ${executable}`);
                let params = [];
                try {
                    progress.report({message: 'Verifying configuration'});
                    params = await AnalyzerUtil.buildParams(config);
                }
                catch (e) {
                    vscode.window.showErrorMessage(`Error: ${e}`);
                    AnalyzerUtil.updateRunEnablement(true, dataProvider, config);
                    return Promise.reject(e);
                }
                rhamtChannel.clear();
                config.cancelled = false;
                const monitor = new AnalyzerProgressMonitor(onComplete);
                const log = (data: string) => {
                    rhamtChannel.print(data);
                    rhamtChannel.print('\n');
                    monitor.handleMessage(data);
                };
                progress.report({message: 'Starting analysis...'});
                let cancelled = false;
                let resolved = false;
                let processController: AnalyzerProcessController;
                const onShutdown = () => {
                    AnalyzerUtil.updateRunEnablement(true, dataProvider, config);
                    if (!resolved) {
                        resolved = true;
                        resolve(undefined);
                    }
                };
                try {
                    processController = await AnalyzerRunner.run(config.rhamtExecutable, params, START_TIMEOUT, log, onShutdown).then(cp => {
                        onStarted();
                        return new AnalyzerProcessController(config.rhamtExecutable, cp, onShutdown);
                    });
                    if (cancelled) {
                        console.log('cli was cancelled during startup.');
                        processController.shutdown();
                        return;
                    }
                } catch (e) {
                    console.log('Error executing cli');
                    console.log(e);
                    onShutdown();
                }
                token.onCancellationRequested(() => {
                    cancelled = true;
                    config.cancelled = true;
                    AnalyzerUtil.updateRunEnablement(true, dataProvider, config);
                    if (processController) {
                        processController.shutdown();
                    }
                    if (!resolved) {
                        resolved = true;
                        resolve(undefined);
                    }
                });
                progress.report({ message: 'Analysis in Progress' });
            });
        });
    }

    static updateRunEnablement(enabled: boolean, dataProvider: DataProvider, config: RhamtConfiguration | null): void {
        if (config != null) {
            const node = dataProvider.findConfigurationNode(config.id);
            node.setBusyAnalyzing(!enabled);
        }
        vscode.commands.executeCommand('setContext', 'cli-enabled', enabled);
    }

    private static buildParams(config: RhamtConfiguration): Promise<any[]> {
        const params = [];
        const options = config.options;
        params.push('analyze');
        params.push('--input');
        const input = options['input'];
        if (!input || input.length === 0) {
            return Promise.reject('input is missing from configuration');
        }
        for (let anInput of input) {
            if (!fs.existsSync(anInput)) {
                return Promise.reject(`input does not exist: ${anInput}`);
            }
        }
        input.forEach(entry => {
            params.push(`${entry}`);
        });
        params.push('--output');
        const output = config.options['output'];
        if (!output || output === '') {
            return Promise.reject('output is missing from configuration');
        }
        params.push(`${output}`);
        let target = options['target'];
        if (!target) {
            target = [];
        }
        if (target.length === 0) {
            target.push('eap7');
        }
        params.push('--target');
        target.forEach((i: any) => {
            params.push(i);
        });
        return Promise.resolve(params);
    }

    public static async loadAnalyzerResults(config: RhamtConfiguration, clearSummary: boolean = true) : Promise<any> {
        return new Promise<void>(async (resolve, reject) => {
            let results = null;
            try {
                if (clearSummary) {
                    let tries = 0;
                    const output = config.options['output'];
                    const location = path.resolve(output, ...config.static());

                    const done = () => {
                        const exists = fs.existsSync(location);
                        if (exists) {
                            console.log('output exist: ' + location);
                            return true;
                        }
                        else if (++tries > 8) {
                            console.log('output was not found after long delay!');
                            return true;
                        }
                        console.log('output does not exist - ' + location);
                        return false;
                    };

                    const poll = resolve => {
                        if(done()) resolve();
                        else setTimeout(_ => poll(resolve), config.delay);
                      }
                    
                    await new Promise(poll);
                    
                }
                results = await AnalyzerUtil.readAnalyzerResults(config);
            }
            catch(e) {
                console.log(`Error reading analyzer results.`);
                console.log(e);                               
                return reject(`Error reading analyzer results.`);
            }
            try {
                const analyzerResults = new AnalyzerResults(results, config);
                await analyzerResults.init();
                config.results = analyzerResults;
                if (clearSummary) {
                    config.summary = {
                        skippedReports: false,
                        outputLocation: config.options['output'],
                        executedTimestamp: '',
                        executable: config.rhamtExecutable,
                        executedTimestampRaw: '',
                        active: true
                    };
                    config.summary.quickfixes = [];
                    config.summary.hintCount = config.results.model.hints.length;
                    config.summary.classificationCount = 0;
                }
                return resolve();
            }
            catch (e) {
                console.log('Error processing analyzer results');
                return reject(`Error processing analyzer results.`);
            }
        });
    }

    public static async readAnalyzerResults(config: RhamtConfiguration): Promise<any> {
        return new Promise<void>((resolve, reject) => {
            try {
                let location = config.options['output'];
                if (!location) {
                    return reject(`Error loading analyzer results. Cannot resolve configuraiton output location.`);
                }
                location = path.resolve(location, ...config.static());
                fs.exists(location, async exists => {
                    if (exists) {
                        try {
                            fs.readFile(location, 'utf8', async (err, data: string) => {
                                if (err) {
                                    return reject(err);
                                }
                                try {
                                    const dataJson = JSON.parse(data.replace(WINDOW, ''));
                                    return resolve(dataJson);                                    
                                }
                                catch (e) {
                                    console.log('Error parsing JSON');
                                    console.log(e);
                                    return reject(e);
                                }
                            });
                        } catch (e) {
                            return reject(`Error loading analyzer results for configuration at ${location} - ${e}`);
                        }
                    }
                    else {
                        return reject(`Output location does not exist - ${location}`);
                    }
                });
            }
            catch (e) {
                return Promise.reject(`Error loading analzyer results from (${config.getResultsLocation()}): ${e}`);
            }
        });
    }
}