import * as vscode from 'vscode';
import { RhamtModelService } from 'raas-core';
import { DataProvider } from '../tree/DataProvider';
import { ITreeNode } from '../tree';

export class RhamtExplorer {

    private dataProvider: DataProvider;

    constructor(private context: vscode.ExtensionContext,
        private modelService: RhamtModelService) {
        this.dataProvider = this.createDataProvider();
        this.createViewer();
        this.createCommands();
    }

    private createCommands(): void {
        this.context.subscriptions.push(vscode.commands.registerCommand('rhamt.createConfiguration', () => {
            this.modelService.createConfiguration();
        }));
        this.context.subscriptions.push(vscode.commands.registerCommand('rhamt.deleteConfiguration', item => {
            const config = item.config;
            this.modelService.deleteConfiguration(undefined, config);
        }));
    }

    private createViewer(): vscode.TreeView<ITreeNode> {
        const treeDataProvider = this.dataProvider;
        const viewer = vscode.window.createTreeView('rhamtExplorerView', { treeDataProvider });
        this.context.subscriptions.push(viewer);
        return viewer;
    }

    private createDataProvider(): DataProvider {
        const provider: DataProvider = new DataProvider(this.modelService);
        this.context.subscriptions.push(provider);
        return provider;
    }
}