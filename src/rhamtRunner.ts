import { commands, Uri, window } from 'vscode';

import * as cp from 'child_process';
import { RhamtConfiguration } from './model/model';

export class RhamtRunner {

    private serverProcess: cp.ChildProcess;

    private config: RhamtConfiguration;

    constructor(config: RhamtConfiguration) {
        this.config = config;
    }

    public stop(): Promise<string> {
        return this.terminate();
    }

    public cancel(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            resolve();
        });
    }

    public analyze(): void {
        // TODO: start analysis
        this.notifyAnalysisComplete();
    }

    private async notifyAnalysisComplete(): Promise<any> {
        const result = await window.showInformationMessage('Analysis complete', 'Open Report');
        if (result === 'Open Report') {
            commands.executeCommand('rhamt.openReport', this.config.report);
        }
    }

    public terminate(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            if (this.serverProcess && !this.serverProcess.killed) {
                this.serverProcess.kill();
                resolve();
            }
            else {
                reject('RHAMT server not running.');
            }
        });
    }
}