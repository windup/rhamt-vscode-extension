import { ConfigurationItem } from './configurationItem';
import { EventEmitter, TreeItemCollapsibleState, Uri, workspace } from 'vscode';
import { AbstractNode, ITreeNode } from './abstractNode';
import { ClassificationNode } from './classificationNode';
import { DataProvider } from './dataProvider';
import * as path from 'path';
import { HintNode } from './hintNode';
import { RhamtConfiguration, ChangeType, IClassification, IHint, ReportHolder, IIssue } from '../model/model';
import { ModelService } from '../model/modelService';
import { FileNode } from './fileNode';
import { FolderNode } from './folderNode';
import { HintsNode } from './hintsNode';
import { ClassificationsNode } from './classificationsNode';
import { SortUtil } from './sortUtil';
import { ResultsNode } from './resultsNode';

export interface Grouping {
    groupByFile: boolean;
    groupBySeverity: boolean;
}

export class ConfigurationNode extends AbstractNode<ConfigurationItem> implements ReportHolder {

    private grouping: Grouping;
    private classifications: IClassification[] = [];
    private hints: IHint[] = [];
    private issueFiles = new Map<string, IIssue[]>();
    private issueNodes = new Map<IIssue, ITreeNode>();
    private resourceNodes = new Map<string, ITreeNode>();
    private childNodes = new Map<string, ITreeNode>();

    private results = [];

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
        return Promise.resolve(this.results);
    }

    public hasMoreChildren(): boolean {
        return this.results.length > 0;
    }

    private listen(): void {
        this.config.onChanged.on(change => {
            if (change.type === ChangeType.MODIFIED &&
                change.name === 'name') {
                this.refresh(this);
            }
        });
        this.config.onResultsLoaded.on(() => {
            this.treeItem.iconPath = {
                light: path.join(__dirname, '..', '..', '..', 'resources', 'light', 'Loading.svg'),
                dark: path.join(__dirname, '..', '..', '..', 'resources', 'dark', 'Loading.svg')
            };
            if (!this.config.results) {
                this.results = [];
                this.treeItem.collapsibleState = TreeItemCollapsibleState.None;
                super.refresh(this);
                setTimeout(() => {
                    this.treeItem.iconPath = undefined;
                    super.refresh(this);
                }, 2000);
                return;
            }
            else {
                this.treeItem.collapsibleState = TreeItemCollapsibleState.Expanded;
                this.results = [
                    new ResultsNode(
                        this.config,
                        this.modelService,
                        this.onNodeCreateEmitter,
                        this.dataProvider,
                        this)
                ];
                this.computeIssues();
                super.refresh(this);
                this.dataProvider.reveal(this, true);
                setTimeout(() => {
                    this.treeItem.iconPath = undefined;
                    this.refresh(this);
                }, 2000);
            }
        });
    }

    private clearModel(): void {
        this.classifications = [];
        this.hints = [];
        this.issueFiles.clear();
        this.issueNodes.clear();
        this.resourceNodes.clear();
        this.childNodes.clear();
    }

    private computeIssues(): void {
        this.clearModel();
        if (this.config.results) {
            this.config.results.getClassifications().forEach(classification => {
                this.classifications.push(classification);
                this.initIssue(classification, this.createClassificationNode(classification));
            });
            this.config.results.getHints().forEach(hint => {
                this.hints.push(hint);
                this.initIssue(hint, this.createHintNode(hint));
            });
        }
    }

    private initIssue(issue: IIssue, node: ITreeNode): void {
        let nodes = this.issueFiles.get(issue.file);
        if (!nodes) {
            nodes = [];
            this.issueFiles.set(issue.file, nodes);
        }
        nodes.push(issue);
        this.issueNodes.set(issue, node);
        this.buildResourceNodes(issue.file);
    }

    private buildResourceNodes(file: string): void {
        if (!this.resourceNodes.has(file)) {
            this.resourceNodes.set(file, new FileNode(
                this.config,
                file,
                this.modelService,
                this.onNodeCreateEmitter,
                this.dataProvider,
                this));

            const root = workspace.getWorkspaceFolder(Uri.file(file));

            if (!this.childNodes.has(root.uri.fsPath)) {
                this.childNodes.set(root.uri.fsPath, new FolderNode(
                    this.config,
                    root.uri.fsPath,
                    this.modelService,
                    this.onNodeCreateEmitter,
                    this.dataProvider,
                    this));
            }

            const getParent = location => path.resolve(location, '..');
            let parent = getParent(file);

            while (parent) {
                if (this.resourceNodes.has(parent)) {
                    break;
                }
                this.resourceNodes.set(parent, new FolderNode(
                    this.config,
                    parent,
                    this.modelService,
                    this.onNodeCreateEmitter,
                    this.dataProvider,
                    this));
                if (root.uri.fsPath === parent) {
                    break;
                }
                parent = getParent(parent);
            }
        }
    }

    getChildNodes(node: ITreeNode): ITreeNode[] {
        const children = [];
        if (node instanceof ResultsNode) {
            if (this.grouping.groupByFile) {
                const children = Array.from(this.childNodes.values());
                return children.sort(SortUtil.sort);
            }
            return Array.from(this.issueNodes.values());
        }
        if (node instanceof FileNode) {
            const issues = this.issueFiles.get((node as FileNode).file);
            if (issues) {
                issues.forEach(issue => children.push(this.issueNodes.get(issue)));
            }
        }
        else if (node instanceof HintsNode) {
            const issues = this.issueFiles.get((node as HintsNode).file);
            if (issues) {
                issues.forEach(issue => children.push(this.issueNodes.get(issue)));
            }
        }
        else if (node instanceof ClassificationsNode) {
            const issues = this.issueFiles.get((node as ClassificationsNode).file);
            if (issues) {
                issues.forEach(issue => children.push(this.issueNodes.get(issue)));
            }
        }
        else {
            const segments = this.getChildSegments((node as FolderNode).folder);
            segments.forEach(segment => children.push(this.resourceNodes.get(segment)));
        }
        return children;
    }

    private getChildSegments(segment: string): string[] {
        const children = [];
        this.resourceNodes.forEach((value, key) => {
            if (key !== segment && key.includes(segment)) {
                if (path.resolve(key, '..') === segment) {
                    children.push(key);
                }
            }
        });
        return children;
    }

    protected refresh(node?: ITreeNode): void {
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
