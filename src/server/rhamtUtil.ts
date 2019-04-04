import * as vscode from 'vscode';
import { Utils } from '../Utils';
import { RhamtConfiguration } from '../model/model';
import { RhamtRunner } from './rhamtRunner';
import { RhamtProcessController } from './RhamtProcessController';
import { ProgressMonitor } from './progressMonitor';
import * as path from 'path';
const PROGRESS_REGEX = /^:progress: /;
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

    static async analyze(config: RhamtConfiguration): Promise<RhamtProcessController> {
        try {
            await Utils.initConfiguration(config);
        } catch (e) {
            return Promise.reject();
        }

        return vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            cancellable: true
        }, async (progress: any, token: any) => {
            return new Promise<any>(async resolve => {
                const executable = await Utils.findRhamtCli();
                const windupHome = path.resolve(executable, '..', '..');
                let params = [];
                try {
                    params = await RhamtUtil.buildParams(config, windupHome);
                }
                catch (e) {
                    vscode.window.showErrorMessage(`Error: ${e}`);
                    return Promise.reject();
                }
                rhamtChannel.clear();
                progress.report({message: 'Executing rhamt-cli script...'});
                let cancelled = false;
                let resolved = false;
                let serverManager: RhamtProcessController;
                const onComplete = async () => {
                    serverManager.shutdown();
                    const result = await vscode.window.showInformationMessage('Analysis complete', 'Open Report');
                    if (result === 'Open Report') {
                        const report = path.resolve(config.options['output'], 'index.html');
                        vscode.commands.executeCommand('rhamt.openReport', report);
                    }
                    if (!resolved) {
                        resolve();
                    }
                };
                const monitor = new ProgressMonitor(progress, onComplete);
                const onMessage = (data: string) => {
                    if (data.includes(':progress:')) {
                        const raw = data.replace(PROGRESS_REGEX, '');
                        monitor.handleMessage(JSON.parse(raw));
                    }
                    else if (data && data.length > 1) {
                        rhamtChannel.print(data);
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
                    serverManager = await RhamtRunner.run(config.rhamtExecutable, params, START_TIMEOUT, onMessage).then(cp => {
                        return new RhamtProcessController(config.rhamtExecutable, cp, onShutdown);
                    });
                    if (cancelled) {
                        console.log('rhamt-cli was cancelled during startup.');
                        serverManager.shutdown();
                        return;
                    }
                } catch (e) {
                    console.log(e);
                    progress.report({message: `Error: ${e}`});
                    return Promise.reject();
                }
                token.onCancellationRequested(() => {
                    cancelled = true;
                    if (serverManager) {
                        serverManager.shutdown();
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
        if (source) {
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
        return Promise.resolve(params);
    }
}