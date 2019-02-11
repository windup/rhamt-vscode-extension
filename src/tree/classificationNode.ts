import { AbstractNode } from './abstractNode';
import { RhamtConfiguration, RhamtModelService, IClassification } from 'raas-core';
import { ITreeNode } from '.';
import * as vscode from 'vscode';
import { DataProvider } from './dataProvider';
import { ClassificationItem } from './classificationItem';

export class ClassificationNode extends AbstractNode {

    private classification: IClassification;

    constructor(
        classification: IClassification,
        config: RhamtConfiguration,
        modelService: RhamtModelService,
        onNodeCreateEmitter: vscode.EventEmitter<ITreeNode>,
        dataProvider: DataProvider) {
        super(config, modelService, onNodeCreateEmitter, dataProvider);
        this.classification = classification;
        this.treeItem = this.createItem();
    }

    getChildren(): Promise<ITreeNode[]> {
        return Promise.resolve([]);
    }

    delete(): Promise<void> {
        return Promise.resolve();
    }

    createItem(): ClassificationItem {
        const item = new ClassificationItem(this.config, this.classification);
        return item;
    }
}