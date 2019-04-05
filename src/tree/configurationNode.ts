import { ConfigurationItem } from './configurationItem';
import { EventEmitter, TreeItemCollapsibleState } from 'vscode';
import { AbstractNode, ITreeNode } from './abstractNode';
import { ClassificationNode } from './classificationNode';
import { DataProvider } from './dataProvider';
import * as path from 'path';
import { HintNode } from './hintNode';
import { RhamtConfiguration, ChangeType, IClassification, IHint } from '../model/model';
import { ModelService } from '../model/modelService';

export class ConfigurationNode extends AbstractNode<ConfigurationItem> {

    private loading: boolean = false;

    constructor(
        config: RhamtConfiguration,
        modelService: ModelService,
        onNodeCreateEmitter: EventEmitter<ITreeNode>,
        dataProvider: DataProvider) {
        super(config, modelService, onNodeCreateEmitter, dataProvider);
        this.treeItem = this.createItem();
        this.listen();
    }

    createItem(): ConfigurationItem {
        const item = new ConfigurationItem(this.config);
        return item;
    }

    delete(): Promise<void> {
        return Promise.resolve();
    }

    public getChildren(): Promise<ITreeNode[]> {
        if (this.loading) {
            return Promise.resolve([]);
        }
        return new Promise<ITreeNode[]>(resolve => {
            const children: ITreeNode[] = [];
            if (this.config.results) {
                this.config.results.getClassifications().forEach(classification => {
                    const node: ITreeNode = this.createClassificationNode(classification);
                    children.push(node);
                });
                this.config.results.getHints().forEach(hint => {
                    const node: ITreeNode = this.createHintNode(hint);
                    children.push(node);
                });
            }
            resolve(children);
        });
    }

    public hasMoreChildren(): boolean {
        if (this.config.results) {
            const classificiations = this.config.results.getClassifications();
            if (classificiations.length > 0) {
                return true;
            }
            const hints = this.config.results.getHints();
            if (hints.length > 0) {
                return true;
            }
        }
        return false;
    }

    public compareChildren?(node1: ITreeNode, node2: ITreeNode): number {
        return -1;
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
                light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'Loading.svg'),
                dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'Loading.svg')
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
        this.treeItem.refresh();
        super.refresh(node);
    }
}
