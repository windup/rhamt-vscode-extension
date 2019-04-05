import * as vscode from 'vscode';
import { DataProvider } from '../tree/DataProvider';
import { ModelService } from '../model/modelService';
import { ITreeNode } from '../tree/abstractNode';

export class RhamtExplorer {

    private dataProvider: DataProvider;

    constructor(private context: vscode.ExtensionContext,
        private modelService: ModelService) {
        this.dataProvider = this.createDataProvider();
        this.createViewer();
        this.createCommands();
    }

    private createCommands(): void {
        this.context.subscriptions.push(vscode.commands.registerCommand('rhamt.explorerCreateConfiguration', () => {
            this.modelService.createConfiguration();
            this.dataProvider.refresh();
        }));
        this.context.subscriptions.push(vscode.commands.registerCommand('rhamt.deleteConfiguration', item => {
            const config = item.config;
            this.modelService.deleteConfiguration(config);
            this.dataProvider.refresh();
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