/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { AbstractNode, ITreeNode } from './abstractNode';
import * as vscode from 'vscode';
import { DataProvider } from './dataProvider';
import { HintItem } from './hintItem';
import { IHint, RhamtConfiguration, ReportHolder, IssueContainer, IIssue } from '../model/model';
import { ModelService } from '../model/modelService';

export class HintNode extends AbstractNode implements ReportHolder, IssueContainer {

    hint: IHint;
    item: HintItem;

    constructor(
        hint: IHint,
        config: RhamtConfiguration,
        modelService: ModelService,
        onNodeCreateEmitter: vscode.EventEmitter<ITreeNode>,
        dataProvider: DataProvider
        ) {
        super(config, modelService, onNodeCreateEmitter, dataProvider);
        this.hint = hint;
        this.treeItem = this.createItem();
    }

    getChildren(): Promise<ITreeNode[]> {
        return Promise.resolve([]);
    }

    delete(): Promise<void> {
        return Promise.resolve();
    }

    createItem(): HintItem {
        this.item = new HintItem(this.hint);
        return this.item;
    }

    getReport(): string {
        return this.hint.report;
    }

    getIssue(): IIssue {
        return this.hint;
    }

    setComplete(): void {
        this.hint.complete = true;
        this.config.markIssueAsComplete(this.getIssue());
        (this.treeItem as HintItem).refresh();
        this.dataProvider.refresh(this);
    }
}