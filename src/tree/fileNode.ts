import { EventEmitter, TreeItemCollapsibleState } from 'vscode';
import { AbstractNode, ITreeNode } from './abstractNode';
import { ClassificationNode } from './classificationNode';
import { DataProvider } from './dataProvider';
import { HintNode } from './hintNode';
import { RhamtConfiguration, IClassification, IHint, ReportHolder } from '../model/model';
import { ModelService } from '../model/modelService';
import { FileItem } from './fileItem';
import * as path from 'path';

export class FileNode extends AbstractNode<FileItem> implements ReportHolder {

    private loading: boolean = false;
    private file: string;

    private issues = [];

    constructor(
        config: RhamtConfiguration,
        file: string,
        modelService: ModelService,
        onNodeCreateEmitter: EventEmitter<ITreeNode>,
        dataProvider: DataProvider) {
        super(config, modelService, onNodeCreateEmitter, dataProvider);
        this.file = file;
        this.treeItem = this.createItem();
        this.listen();
    }

    createItem(): FileItem {
        return new FileItem(this.file);
    }

    delete(): Promise<void> {
        return Promise.resolve();
    }

    public getChildren(): Promise<ITreeNode[]> {
        if (this.loading) {
            return Promise.resolve([]);
        }
        return Promise.resolve(this.issues);
    }

    public hasMoreChildren(): boolean {
        return this.issues.length > 0;
    }

    public compareChildren?(node1: ITreeNode, node2: ITreeNode): number {
        return -1;
    }

    private listen(): void {
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
        }, 1000);
    }

    protected refresh(node?: ITreeNode): void {
        this.issues = [];
        this.config.results.getClassificationsFor(this.file).forEach(classification => {
            if (classification.file === this.file) {
                this.issues.push(this.createClassificationNode(classification));
            }
        });
        this.config.results.getHintsFor(this.file).forEach(hint => {
            if (hint.file === this.file) {
                this.issues.push(this.createHintNode(hint));
            }
        });
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
