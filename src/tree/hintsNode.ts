/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { EventEmitter } from 'vscode';
import { AbstractNode, ITreeNode } from './abstractNode';
import { DataProvider } from './dataProvider';
import { RhamtConfiguration, IQuickFix } from '../model/model';
import { ModelService } from '../model/modelService';
import { ConfigurationNode } from './configurationNode';
import { HintsItem } from './hintsItem';
import { HintNode } from './hintNode';

export class HintsNode extends AbstractNode<HintsItem> {

    private loading: boolean = false;
    private children = [];

    file: string;
    quickfixes: IQuickFix[];
    
    constructor(
        config: RhamtConfiguration,
        file: string,
        modelService: ModelService,
        onNodeCreateEmitter: EventEmitter<ITreeNode>,
        dataProvider: DataProvider,
        root: ConfigurationNode) {
        super(config, modelService, onNodeCreateEmitter, dataProvider);
        this.file = file;
        this.root = root;
        this.quickfixes = this.config.getQuickfixesForResource(this.file);
    }

    createItem(): HintsItem {
        this.treeItem = new HintsItem(this.file, this.quickfixes.length > 0);
        this.treeItem.iconPath = undefined;
        this.loading = false;
        const unsorted = this.root.getChildNodes(this);
        this.children = unsorted.sort(HintsNode.compareHint);
        this.children.forEach(child => child.parentNode = this);
        this.treeItem.refresh(this.children.length);
        return this.treeItem;
    }

    delete(): Promise<void> {
        return Promise.resolve();
    }

    getLabel(): string {
        return 'Hints';
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

    protected refresh(node?: ITreeNode): void {
        const unsorted = this.root.getChildNodes(this);
        this.children = unsorted.sort(HintsNode.compareHint);
        this.children.forEach(child => child.parentNode = this);
        this.treeItem.refresh(this.children.length);
        super.refresh(node);
    }

    static compareHint(node1: ITreeNode, node2: ITreeNode): number {
        const a = (node1 as HintNode).hint.lineNumber || 0;
        const b = (node2 as HintNode).hint.lineNumber || 0;
        // sort by line number
        if (a !== b) {
            return a < b ? -1 : 1;
        }
        // if same line, sort by column
        else {
            let col1 = (node1 as HintNode).hint.column || 0;
            let col2 = (node2 as HintNode).hint.column || 0;
            if (col1 !== col2) {
                return col1 < col2 ? -1 : 1;
            }
        }
        return 0;
    }
}
