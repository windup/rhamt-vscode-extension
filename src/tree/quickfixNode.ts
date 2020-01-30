/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AbstractNode, ITreeNode } from './abstractNode';
import * as vscode from 'vscode';
import { DataProvider } from './dataProvider';
import { RhamtConfiguration, IssueContainer, IIssue, IQuickFix } from '../model/model';
import { ModelService } from '../model/modelService';
import { QuickfixItem } from './quickfixItem';

export class QuickfixNode extends AbstractNode implements IssueContainer {

    quickfix: IQuickFix;
    item: QuickfixItem;

    constructor(
        quickfix: IQuickFix,
        config: RhamtConfiguration,
        modelService: ModelService,
        onNodeCreateEmitter: vscode.EventEmitter<ITreeNode>,
        dataProvider: DataProvider
        ) {
        super(config, modelService, onNodeCreateEmitter, dataProvider);
        this.quickfix = quickfix;
        this.treeItem = this.createItem();
    }

    getChildren(): Promise<ITreeNode[]> {
        return Promise.resolve([]);
    }

    delete(): Promise<void> {
        return Promise.resolve();
    }

    createItem(): QuickfixItem {
        this.item = new QuickfixItem(this.quickfix);
        return this.item;
    }

    getIssue(): IIssue {
        return this.quickfix.hint;
    }

    setComplete(): void {
    }
}