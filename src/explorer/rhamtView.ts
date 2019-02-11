import * as vscode from 'vscode';
import { RhamtExplorer } from './rhamtExplorer';
import { RhamtModelService } from 'raas-core';

export class RhamtView implements vscode.Disposable {

    constructor(private context: vscode.ExtensionContext,
        private modelService: RhamtModelService) {
        this.createExplorer();
        this.context.subscriptions.push(this);
    }

    private createExplorer(): RhamtExplorer {
        return new RhamtExplorer(this.context, this.modelService);
    }

    public dispose(): void {

    }
}