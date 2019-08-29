/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { AbstractNode, ITreeNode } from './abstractNode';
import * as vscode from 'vscode';
import { DataProvider } from './dataProvider';
import { RhamtConfiguration } from '../model/model';
import { ModelService } from '../model/modelService';
import { ReportItem } from './reportItem';
import { ConfigurationNode } from './configurationNode';

export class ReportNode extends AbstractNode {

    private item: ReportItem;

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
        this.item = new ReportItem(this.config);
        return this.item;
    }

    getReport(): string {
        return this.item.getReport();
    }
}