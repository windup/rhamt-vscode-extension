/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { EventEmitter, TreeItemCollapsibleState } from 'vscode';
import { AbstractNode, ITreeNode } from './abstractNode';
import { DataProvider } from './dataProvider';
import { RhamtConfiguration, IHint, IQuickFix } from '../model/model';
import { ModelService } from '../model/modelService';
import * as path from 'path';
import { ConfigurationNode } from './configurationNode';
import { QuickfixesItem } from './quickfixesItem';
import { QuickfixNode } from './quickfixNode';

export class QuickfixesNode extends AbstractNode<QuickfixesItem> {

    private loading: boolean = false;
    private children = [];

    hint: IHint;
    quickfixes: IQuickFix[];
    
    constructor(
        config: RhamtConfiguration,
        hint: IHint,
        modelService: ModelService,
        onNodeCreateEmitter: EventEmitter<ITreeNode>,
        dataProvider: DataProvider,
        root: ConfigurationNode) {
        super(config, modelService, onNodeCreateEmitter, dataProvider);
        this.hint = hint;
        this.root = root;
        this.quickfixes = this.hint.quickfixes;
        this.treeItem = this.createItem();
        this.listen();
    }

    createItem(): QuickfixesItem {
        return new QuickfixesItem(this.hint);
    }

    delete(): Promise<void> {
        return Promise.resolve();
    }

    private loadChildren() {
        const quickfixes = this.computeQuickfixes();
        this.children = quickfixes.sort(QuickfixesNode.compareQuickfix);
        this.children.forEach(child => child.parentNode = this);
    }

    private computeQuickfixes() {
        const children = [];
        for (let quickfix of this.hint.quickfixes) {
            children.push(new QuickfixNode(
                quickfix,
                this.config,
                this.modelService,
                this.onNodeCreateEmitter,
                this.dataProvider));
        }
        return children;
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

    private listen(): void {
        this.loading = true;
        const base = [__dirname, '..', '..', '..', 'resources'];
        this.treeItem.iconPath = {
            light: path.join(...base, 'light', 'Loading.svg'),
            dark: path.join(...base, 'dark', 'Loading.svg')
        };
        this.treeItem.collapsibleState = TreeItemCollapsibleState.None;
        setTimeout(() => {
            this.treeItem.iconPath = undefined;
            this.loading = false;
            this.refresh(this);
        }, 1000);
    }

    protected refresh(node?: ITreeNode): void {
        this.loadChildren();
        this.treeItem.refresh(this.children.length);
        super.refresh(node);
    }

    static compareQuickfix(node1: ITreeNode, node2: ITreeNode): number {
        const one = (node1 as QuickfixNode).getQuickfixes()[0].name;
        const other = (node2 as QuickfixNode).getQuickfixes()[0].name;
        const a = one || 0;
        const b = other || 0;
        if (a !== b) {
            return a < b ? -1 : 1;
        }
        return 0;
    }
}
