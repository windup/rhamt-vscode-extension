import { ITreeNode } from '.';
import * as vscode from 'vscode';
import { RhamtConfiguration, RhamtModelService } from 'raas-core';
import { DataProvider } from './dataProvider';

export abstract class AbstractNode<T extends vscode.TreeItem = vscode.TreeItem> implements ITreeNode {
    private _id: string = RhamtModelService.generateUniqueId();

    protected config: RhamtConfiguration;
    protected modelService: RhamtModelService;
    protected dataProvider: DataProvider;

    treeItem: T;
    parent?: vscode.TreeItem;

    constructor(
        config: RhamtConfiguration,
        modelService: RhamtModelService,
        dataProvider: DataProvider) {
            this.config = config;
            this.modelService = modelService;
            this.dataProvider = dataProvider;
    }

    public get id(): string {
        return this._id;
    }

    abstract getChildren(): Promise<ITreeNode[]>;
    abstract delete(): Promise<void>;
    abstract createItem(): T;
}