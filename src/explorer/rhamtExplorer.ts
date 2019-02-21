import * as vscode from 'vscode';
import { ModelService } from '../model/modelService';
import { ITreeNode } from '../tree/abstractNode';
import { RhamtTreeDataProvider } from '../tree/rhamtTreeDataProvider';

export class RhamtExplorer {

    private dataProvider: RhamtTreeDataProvider;

    constructor(private context: vscode.ExtensionContext,
        private modelService: ModelService) {
        this.dataProvider = this.createDataProvider();
        this.createViewer();
    }

    private createViewer(): vscode.TreeView<ITreeNode> {
        const treeDataProvider = this.dataProvider;
        const viewer = vscode.window.createTreeView('rhamtExplorerView', { treeDataProvider });
        this.context.subscriptions.push(viewer);
        return viewer;
    }

    private createDataProvider(): RhamtTreeDataProvider {
        const provider: RhamtTreeDataProvider = new RhamtTreeDataProvider(this.modelService);
        return provider;
    }
}