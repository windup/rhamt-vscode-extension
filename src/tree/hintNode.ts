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
import * as path from 'path';
import { QuickfixesNode } from './quickfixesNode';
import { ConfigurationNode } from './configurationNode';

export class HintNode extends AbstractNode<HintItem> implements ReportHolder, IssueContainer {

    private loading: boolean = false;
    hint: IHint;
    item: HintItem;
    private children = [];

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
        this.treeItem = this.item = this.createItem();
        this.init();
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

    createItem(): HintItem {
        return new HintItem(this.hint);
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

    private init(): void {
        this.loading = true;
        const base = [__dirname, '..', '..', '..', 'resources'];
        this.treeItem.iconPath = {
            light: path.join(...base, 'light', 'Loading.svg'),
            dark: path.join(...base, 'dark', 'Loading.svg')
        };
        this.treeItem.collapsibleState = vscode.TreeItemCollapsibleState.None;
        super.refresh(this);
        setTimeout(() => {
            this.loading = false;
            this.refresh(this);
        }, 1000);
    }

    refresh(node?: ITreeNode): void {
        if (this.hint.quickfixes.length > 0 ) {
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
        }
        this.treeItem.refresh();
        super.refresh(node);
    }
}
