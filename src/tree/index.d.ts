import * as vscode from 'vscode';
import { Uri } from "vscode";
import { RhamtConfiguration } from 'raas-core';
import { DataProvider } from './dataProvider';

export interface ITreeNode<T extends vscode.TreeItem = vscode.TreeItem> {
    readonly treeItem: T;
    readonly parent?: vscode.TreeItem;
    getChildren(): Promise<ITreeNode[]>;
    delete(): Promise<void>;
}
