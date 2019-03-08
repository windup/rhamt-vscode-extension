import * as vscode from 'vscode';
import { RhamtConfiguration } from '../model/model';
import { ModelService } from '../model/modelService';
import { RhamtTreeDataProvider } from './rhamtTreeDataProvider';

export abstract class AbstractNode<T extends vscode.TreeItem = vscode.TreeItem> implements ITreeNode {

    protected config: RhamtConfiguration;
    protected modelService: ModelService;
    protected dataProvider: RhamtTreeDataProvider;

    treeItem: T;
    parent?: vscode.TreeItem;

    constructor(
        config: RhamtConfiguration,
        modelService: ModelService,
        dataProvider: RhamtTreeDataProvider) {
        this.config = config;
        this.modelService = modelService;
        this.dataProvider = dataProvider;
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
}