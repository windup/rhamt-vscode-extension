'use strict';

import * as vscode from 'vscode';
import { RhamtExplorer } from './rhamtExplorer';
import { RhamtModelService } from '../rhamtService/modelService';

export class RhamtView implements vscode.Disposable {

    private explorer: RhamtExplorer;
    
    constructor(private context: vscode.ExtensionContext, 
        private modelService: RhamtModelService) {
        this.explorer = this.createExplorer();
        this.context.subscriptions.push(this);
    }

    private createExplorer(): RhamtExplorer {
        let explorer = new RhamtExplorer(this.context, this.modelService);
        return explorer;
    }

    public dispose(): void {

    }
}