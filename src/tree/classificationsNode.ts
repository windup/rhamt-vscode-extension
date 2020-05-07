/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { EventEmitter } from 'vscode';
import { AbstractNode, ITreeNode } from './abstractNode';
import { DataProvider } from './dataProvider';
import { RhamtConfiguration, IQuickFix, IIssueType } from '../model/model';
import { ModelService } from '../model/modelService';
import { ConfigurationNode } from './configurationNode';
import { ClassificationsItem } from './classificationsItem';
import { SortUtil } from './sortUtil';

export class ClassificationsNode extends AbstractNode<ClassificationsItem> {

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
        this.quickfixes = this.computeQuickfixes();
    }

    computeQuickfixes(): IQuickFix[] {
        return this.config.getQuickfixesForResource(this.file).filter(quickfix => {
            return quickfix.issue.type === IIssueType.Classification 
        });
    }

    createItem(): ClassificationsItem {
        this.treeItem = new ClassificationsItem(this.file, this.quickfixes.length > 0);
        this.treeItem.iconPath = undefined;
        this.loading = false;
        this.refresh();
        return this.treeItem;
    }

    delete(): Promise<void> {
        return Promise.resolve();
    }

    getLabel(): string {
        return 'Classifications';
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

    protected refresh(): void {
        const unsorted = this.root.getChildNodes(this);
        this.children = unsorted.sort(SortUtil.sort);
        this.children.forEach(child => child.parentNode = this);
        this.treeItem.refresh(this.children.length);
    }
}
