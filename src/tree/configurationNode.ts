import { ConfigurationItem } from './configurationItem';
import { EventEmitter, TreeItemCollapsibleState } from 'vscode';
import { AbstractNode, ITreeNode } from './abstractNode';
import { ClassificationNode } from './classificationNode';
import { DataProvider } from './dataProvider';
import * as path from 'path';
import { HintNode } from './hintNode';
import { RhamtConfiguration, ChangeType, IClassification, IHint, ReportHolder } from '../model/model';
import { ModelService } from '../model/modelService';
import { FileNode } from './fileNode';

export interface Grouping {
    groupByFile: boolean;
    groupBySeverity: boolean;
}

export class ConfigurationNode extends AbstractNode<ConfigurationItem> implements ReportHolder {

    private grouping: Grouping;
    private loading: boolean = false;

    private issues = [];
    private files = [];

    constructor(
        config: RhamtConfiguration,
        grouping: Grouping,
        modelService: ModelService,
        onNodeCreateEmitter: EventEmitter<ITreeNode>,
        dataProvider: DataProvider) {
        super(config, modelService, onNodeCreateEmitter, dataProvider);
        this.grouping = grouping;
        this.treeItem = this.createItem();
        this.listen();
    }

    createItem(): ConfigurationItem {
        return new ConfigurationItem(this.config);
    }

    delete(): Promise<void> {
        return Promise.resolve();
    }

    public getChildren(): Promise<any> {
        if (this.loading) {
            return Promise.resolve([]);
        }
        if (this.grouping.groupByFile) {
            return Promise.resolve(this.files);
        }
        return Promise.resolve(this.issues);
    }

    public hasMoreChildren(): boolean {
        if (this.config.results) {
            if (this.grouping.groupByFile) {
                return this.files.length > 0;
            }
            return this.issues.length > 0;
        }
        return false;
    }

    public compareChildren?(node1: ITreeNode, node2: ITreeNode): number {
        return -1;
    }

    private listen(): void {
        this.config.onChanged.on(change => {
            if (change.type === ChangeType.MODIFIED &&
                change.name === 'name') {
                this.refresh(this);
            }
        });
        this.config.onResultsLoaded.on(() => {
            this.loading = true;
            this.treeItem.iconPath = {
                light: path.join(__dirname, '..', '..', '..', 'resources', 'light', 'Loading.svg'),
                dark: path.join(__dirname, '..', '..', '..', 'resources', 'dark', 'Loading.svg')
            };
            this.treeItem.collapsibleState = TreeItemCollapsibleState.None;
            super.refresh(this);
            setTimeout(() => {
                this.treeItem.iconPath = undefined;
                this.loading = false;
                this.refresh(this);
            }, 2000);
        });
    }

    protected refresh(node?: ITreeNode): void {
        this.issues = [];
        this.files = [];
        if (this.config.results) {
            const fileMap = new Map<string, ITreeNode>();
            this.config.results.getClassifications().forEach(classification => {
                this.issues.push(this.createClassificationNode(classification));
                const file = fileMap.get(classification.file);
                if (!file) {
                    fileMap.set(classification.file, new FileNode(
                        this.config,
                        classification.file,
                        this.modelService,
                        this.onNodeCreateEmitter,
                        this.dataProvider));
                }
            });
            this.config.results.getHints().forEach(hint => {
                this.issues.push(this.createHintNode(hint));
                const file = fileMap.get(hint.file);
                if (!file) {
                    fileMap.set(hint.file, new FileNode(
                        this.config,
                        hint.file,
                        this.modelService,
                        this.onNodeCreateEmitter,
                        this.dataProvider));
                }
            });
            this.files = Array.from(fileMap.values());
        }
        this.treeItem.refresh();
        super.refresh(node);
    }

    createClassificationNode(classification: IClassification): ITreeNode {
        const node: ITreeNode = new ClassificationNode(
            classification,
            this.config,
            this.modelService,
            this.onNodeCreateEmitter,
            this.dataProvider);
        this.onNodeCreateEmitter.fire(node);
        return node;
    }

    createHintNode(hint: IHint): ITreeNode {
        const node: ITreeNode = new HintNode(
            hint,
            this.config,
            this.modelService,
            this.onNodeCreateEmitter,
            this.dataProvider);
        this.onNodeCreateEmitter.fire(node);
        return node;
    }

    getReport(): string {
        return this.config.getReport();
    }
}
