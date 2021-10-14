/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { AbstractNode, ITreeNode } from './abstractNode';
import * as vscode from 'vscode';
import { DataProvider } from './dataProvider';
import { HintItem } from './hintItem';
import { IHint, RhamtConfiguration, ReportHolder, IssueContainer, IIssue, IQuickFix, ChangeType } from '../model/model';
import { ModelService } from '../model/modelService';
import { QuickfixesNode } from './quickfixesNode';
import { ConfigurationNode } from './configurationNode';
import { refreshOpenEditors } from '../source/markers';

export class HintNode extends AbstractNode<HintItem> implements ReportHolder, IssueContainer {

    private loading: boolean = false;
    hint: IHint;
    item: HintItem;
    private children = [];
    quickfixes: IQuickFix[];

    constructor(
        hint: IHint,
        config: RhamtConfiguration,
        modelService: ModelService,
        onNodeCreateEmitter: vscode.EventEmitter<ITreeNode>,
        dataProvider: DataProvider,
        root: ConfigurationNode
        ) {
        super(config, modelService, onNodeCreateEmitter, dataProvider);
        this.root = root;
        this.hint = hint;
        this.quickfixes = this.hint.quickfixes;
        this.listen();
    }

    public getChildren(): Promise<ITreeNode[]> {
        if (this.loading) {
            return Promise.resolve([]);
        }
        return Promise.resolve(this.children);
    }

    public hasMoreChildren(): boolean {
        return this.children.length > 0;
    }

    delete(): Promise<void> {
        return Promise.resolve();
    }

    getLabel(): string {
        return `${this.hint.title} [rule-id: ${this.hint.ruleId}]`;
    }

    createItem(): HintItem {
        this.treeItem = new HintItem(this.hint);
        this.loading = false;
        if (this.hint.quickfixes.length > 0) {
            const quickfix = new QuickfixesNode(
                this.config,
                this.hint,
                this.modelService,
                this.onNodeCreateEmitter,
                this.dataProvider,
                this.root
            );
            (quickfix as any).parentNode = this;
            this.children.push(quickfix);
            this.treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        }
        this.treeItem.refresh();
        return this.treeItem;
    }

    getReport(): string {
        return this.hint.report;
    }

    getIssue(): IIssue {
        return this.hint;
    }

    setComplete(complete: boolean): void {
        this.getIssue().complete = complete;
        this.config.markIssueAsComplete(this.getIssue(), complete);
        (this.treeItem as HintItem).refresh();
        this.dataProvider.refresh(this);
        refreshOpenEditors(this.modelService, this.getIssue().file);
    }

    private async listen(): Promise<void> {
        const listener = change => {
            const container = this.quickfixes.find(quickfix => quickfix.id === change.value);
            if (change.type === ChangeType.QUICKFIX_APPLIED && container) {
                this.setComplete(true);
            }
        };
        this.config.onChanged.on(listener);
    }
}
