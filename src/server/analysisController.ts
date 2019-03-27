import { RhamtConfiguration } from '../model/model';
import { commands, window } from 'vscode';

export class AnalysisController {

    private config: RhamtConfiguration;

    constructor(config: RhamtConfiguration) {
        this.config = config;
    }

    public cancel(): void {
        this.notifyAnalysisCancelled();
    }

    public analyze(): void {
        this.notifyAnalysisComplete();
    }

    private async notifyAnalysisCancelled(): Promise<any> {
        window.showInformationMessage(`Analysis Cancelled for ${this.config.name}`);
    }

    private async notifyAnalysisComplete(): Promise<any> {
        const result = await window.showInformationMessage('Analysis complete', 'Open Report');
        if (result === 'Open Report') {
            commands.executeCommand('rhamt.openReport', this.config.report);
        }
    }
}