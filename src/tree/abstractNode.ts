import * as vscode from 'vscode';
import { RhamtConfiguration } from '../model/model';
import { ModelService } from '../model/modelService';
import { DataProvider } from './dataProvider';
import { ConfigurationNode } from './configurationNode';

export abstract class AbstractNode<T extends vscode.TreeItem = vscode.TreeItem> implements ITreeNode {
    private _id: string = ModelService.generateUniqueId();

    protected onNodeCreateEmitter: vscode.EventEmitter<ITreeNode>;
    protected config: RhamtConfiguration;
    protected modelService: ModelService;
    protected dataProvider: DataProvider;

    treeItem: T;
    parent?: vscode.TreeItem;
    root: ConfigurationNode;

    constructor(
        config: RhamtConfiguration,
        modelService: ModelService,
        onNodeCreateEmitter: vscode.EventEmitter<ITreeNode>,
        dataProvider: DataProvider) {
        this.config = config;
        this.modelService = modelService;
        this.onNodeCreateEmitter = onNodeCreateEmitter;
        this.dataProvider = dataProvider;
    }

    public get id(): string {
        return this._id;
    }

    protected refresh(node?: ITreeNode): void {
        this.dataProvider.refresh(node);
    }

    getLabel(): string {
        return this.treeItem.label;
    }

    abstract getChildren(): Promise<ITreeNode[]>;
    abstract delete(): Promise<void>;
    abstract createItem(): T;
}

export interface ITreeNode<T extends vscode.TreeItem = vscode.TreeItem> {
    readonly treeItem: T;
    readonly parent?: vscode.TreeItem;
    getChildren(): Promise<ITreeNode[]>;
    delete(): Promise<void>;
    getLabel(): string;
}
