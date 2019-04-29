import { EventEmitter, TreeItemCollapsibleState } from 'vscode';
import { AbstractNode, ITreeNode } from './abstractNode';
import { DataProvider } from './dataProvider';
import { RhamtConfiguration } from '../model/model';
import { ModelService } from '../model/modelService';
import * as path from 'path';
import { ConfigurationNode } from './configurationNode';
import { FileItem } from './fileItem';
import { HintNode } from './hintNode';
import { HintsNode } from './hintsNode';
import { ClassificationsNode } from './classificationsNode';
import { ClassificationNode } from './classificationNode';

export class FileNode extends AbstractNode<FileItem> {

    private loading: boolean = false;

    file: string;
    private children = [];

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
        super.refresh(this);
        setTimeout(() => {
            this.loading = false;
            this.refresh(this);
        }, 1000);
    }

    protected refresh(node?: ITreeNode): void {
        this.children = [];
        const ext = path.extname(this.file);
        const icon = ext === '.xml' ? 'file_type_xml.svg' : ext === '.java' ? 'file_type_java.svg' : 'default_file.svg';
        this.treeItem.iconPath = {
            light: path.join(__dirname, '..', '..', '..', 'resources', 'light', icon),
            dark: path.join(__dirname, '..', '..', '..', 'resources', 'dark', icon)
        };
        const issues = this.root.getChildNodes(this);
        if (issues.find(issue => issue instanceof HintNode)) {
            this.children.push(new HintsNode(
                this.config,
                this.file,
                this.modelService,
                this.onNodeCreateEmitter,
                this.dataProvider,
                this.root));
        }
        if (issues.find(issue => issue instanceof ClassificationNode)) {
            this.children.push(new ClassificationsNode(
                this.config,
                this.file,
                this.modelService,
                this.onNodeCreateEmitter,
                this.dataProvider,
                this.root));
        }
        this.treeItem.refresh();
        super.refresh(node);
    }
}
