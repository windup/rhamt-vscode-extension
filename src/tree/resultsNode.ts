/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { EventEmitter } from 'vscode';
import { AbstractNode, ITreeNode } from './abstractNode';
import { DataProvider } from './dataProvider';
import { RhamtConfiguration } from '../model/model';
import { ModelService } from '../model/modelService';
import { ConfigurationNode } from './configurationNode';
import { ResultsItem } from './resultsItem';
import { ReportNode } from './reportNode';

export class ResultsNode extends AbstractNode<ResultsItem> {

    private loading: boolean = false;
    private children = [];
    private reportNode: ReportNode;

    constructor(
        config: RhamtConfiguration,
        modelService: ModelService,
        onNodeCreateEmitter: EventEmitter<ITreeNode>,
        dataProvider: DataProvider,
        root: ConfigurationNode) {
        super(config, modelService, onNodeCreateEmitter, dataProvider);
        this.root = root;
        if (!this.config.summary.skippedReports) {
            this.reportNode = new ReportNode(
                config,
                modelService,
                onNodeCreateEmitter,
                dataProvider,
                root);
        }
    }

    createItem(): ResultsItem {
        this.children = [];
        this.treeItem = new ResultsItem();
        this.loading = false;
        this.children = this.config.summary.skippedReports ? [] : [this.reportNode];
        const top = this.root.getChildNodes(this);
        this.children = this.children.concat(top);
        this.children.forEach(child => child.parentNode = this);
        this.treeItem.refresh(this.config.summary.executedTimestamp);
        return this.treeItem;
    }

    delete(): Promise<void> {
        return Promise.resolve();
    }

    getLabel(): string {
        return `Analysis Results (${this.config.summary.executedTimestamp})`;
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
        this.children = this.config.summary.skippedReports ? [] : [this.reportNode]
        this.children = this.children.concat(this.root.getChildNodes(this));
        this.children.forEach(child => child.parentNode = this);
        this.treeItem.refresh(this.config.summary.executedTimestamp);
        super.refresh(node);
    }
}
