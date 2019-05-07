import { AbstractNode, ITreeNode } from './abstractNode';
import * as vscode from 'vscode';
import { DataProvider } from './dataProvider';
import { RhamtConfiguration } from '../model/model';
import { ModelService } from '../model/modelService';
import { ReportItem } from './reportItem';
import { ConfigurationNode } from './configurationNode';

export class ReportNode extends AbstractNode {

    constructor(
        config: RhamtConfiguration,
        modelService: ModelService,
        onNodeCreateEmitter: vscode.EventEmitter<ITreeNode>,
        dataProvider: DataProvider,
        root: ConfigurationNode) {
        super(config, modelService, onNodeCreateEmitter, dataProvider);
        this.root = root;
        this.treeItem = this.createItem();
    }

    getChildren(): Promise<ITreeNode[]> {
        return Promise.resolve([]);
    }

    delete(): Promise<void> {
        return Promise.resolve();
    }

    createItem(): ReportItem {
        return new ReportItem(this.config);
    }
}