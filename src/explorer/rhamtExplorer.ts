'use strict';

import * as vscode from 'vscode';
import { RhamtNode } from './rhamtNode';
import { RhamtModelService } from '../rhamtService/modelService';
import { RhamtTreeDataProvider } from './rhamtExplorerDataProvider';

export class RhamtExplorer {

    private rhamtViewer: vscode.TreeView<RhamtNode>;
    private dataProvider: RhamtTreeDataProvider;

    constructor(private context: vscode.ExtensionContext,
        private modelService: RhamtModelService) {
        this.dataProvider = this.createDataProvider();
        this.rhamtViewer = this.createViewer();
    }

    private createViewer(): vscode.TreeView<RhamtNode> {
        let treeDataProvider = this.dataProvider;
        const viewer = vscode.window.createTreeView('rhamtExplorerView', { treeDataProvider });
        this.context.subscriptions.push(viewer);
        return viewer;
    }

    private createDataProvider(): RhamtTreeDataProvider {
        const dataProvider = new RhamtTreeDataProvider(this.context, this.modelService);
        return dataProvider;
    }
}