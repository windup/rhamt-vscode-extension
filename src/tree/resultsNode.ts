import { EventEmitter, TreeItemCollapsibleState } from 'vscode';
import { AbstractNode, ITreeNode } from './abstractNode';
import { DataProvider } from './dataProvider';
import { RhamtConfiguration } from '../model/model';
import { ModelService } from '../model/modelService';
import * as path from 'path';
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
        this.reportNode = new ReportNode(
            config,
            modelService,
            onNodeCreateEmitter,
            dataProvider,
            root);
        this.treeItem = this.createItem();
        this.listen();
    }

    createItem(): ResultsItem {
        return new ResultsItem();
    }

    delete(): Promise<void> {
        return Promise.resolve();
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
        this.treeItem.iconPath = {
            light: path.join(__dirname, '..', '..', '..', 'resources', 'light', 'Loading.svg'),
            dark: path.join(__dirname, '..', '..', '..', 'resources', 'dark', 'Loading.svg')
        };
        this.treeItem.collapsibleState = TreeItemCollapsibleState.None;
        setTimeout(() => {
            this.treeItem.iconPath = undefined;
            this.loading = false;
            this.refresh(this);
            this.dataProvider.reveal(this, true);
        }, 1000);
    }

    protected refresh(node?: ITreeNode): void {
        this.children = [this.reportNode];
        this.children = this.children.concat(this.root.getChildNodes(this));
        this.children.forEach(child => child.parentNode = this);
        this.treeItem.refresh(this.config.summary.executedTimestamp);
        super.refresh(node);
    }
}
