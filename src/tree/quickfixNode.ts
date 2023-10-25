/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AbstractNode, ITreeNode } from './abstractNode';
import * as vscode from 'vscode';
import { DataProvider } from './dataProvider';
import { RhamtConfiguration, IIssue, IQuickFix, ChangeType } from '../server/analyzerModel';
import { ModelService } from '../model/modelService';
import { QuickfixItem } from './quickfixItem';
import { Quickfix } from '../quickfix/quickfix';

export class QuickfixNode extends AbstractNode implements Quickfix.IQuickfixContainer  {

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
        this.listen();
    }

    getChildren(): Promise<ITreeNode[]> {
        return Promise.resolve([]);
    }

    delete(): Promise<void> {
        return Promise.resolve();
    }

    getLabel(): string {
        return `${this.quickfix.name} [type: ${new String(this.quickfix.type).toLowerCase()}]`;
    }

    createItem(): QuickfixItem {
        this.item = this.treeItem = new QuickfixItem(this.quickfix);
        return this.item;
    }

    getIssue(): IIssue {
        return this.quickfix.issue;
    }

    setComplete(): void {
    }

    getQuickfixes(): IQuickFix[] {
        return [this.quickfix];
    }

    protected refresh(node?: ITreeNode): void {
        (this.item as QuickfixItem).refresh();
        super.refresh(node);
    }

    private async listen(): Promise<void> {
        const listener = change => {
            const container = this.quickfix.id === change.value;
            if (change.type === ChangeType.QUICKFIX_APPLIED && container) {
                if (this.treeItem) {
                    // parent hintNode also listens and refreshes itslef
                    (this.item as QuickfixItem).refresh();
                }
            }
        };
        this.config.onChanged.on(listener);
    }
}
