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

    abstract getChildren(): Promise<ITreeNode[]>;
    abstract delete(): Promise<void>;
    abstract createItem(): T;

    public compareChildren?(node1: ITreeNode, node2: ITreeNode): number {
        return -1;
    }

    public compare(statA: ITreeNode, statB: ITreeNode): number {
        return -1;
		// Do not sort roots
		// if (statA.isRoot) {
		// 	if (statB.isRoot) {
		// 		const workspaceA = this.contextService.getWorkspaceFolder(statA.resource);
		// 		const workspaceB = this.contextService.getWorkspaceFolder(statB.resource);
		// 		return workspaceA && workspaceB ? (workspaceA.index - workspaceB.index) : -1;
		// 	}

		// 	return -1;
		// }

		// if (statB.isRoot) {
		// 	return 1;
		// }

		// const sortOrder = this.explorerService.sortOrder;

		// // Sort Directories
		// switch (sortOrder) {
		// 	case 'type':
		// 		if (statA.isDirectory && !statB.isDirectory) {
		// 			return -1;
		// 		}

		// 		if (statB.isDirectory && !statA.isDirectory) {
		// 			return 1;
		// 		}

		// 		if (statA.isDirectory && statB.isDirectory) {
		// 			return compareFileNames(statA.name, statB.name);
		// 		}

		// 		break;

		// 	case 'filesFirst':
		// 		if (statA.isDirectory && !statB.isDirectory) {
		// 			return 1;
		// 		}

		// 		if (statB.isDirectory && !statA.isDirectory) {
		// 			return -1;
		// 		}

		// 		break;

		// 	case 'mixed':
		// 		break; // not sorting when "mixed" is on

		// 	default: /* 'default', 'modified' */
		// 		if (statA.isDirectory && !statB.isDirectory) {
		// 			return -1;
		// 		}

		// 		if (statB.isDirectory && !statA.isDirectory) {
		// 			return 1;
		// 		}

		// 		break;
		// }

		// // Sort Files
		// switch (sortOrder) {
		// 	case 'type':
		// 		return compareFileExtensions(statA.name, statB.name);

		// 	case 'modified':
		// 		if (statA.mtime !== statB.mtime) {
		// 			return (statA.mtime && statB.mtime && statA.mtime < statB.mtime) ? 1 : -1;
		// 		}

		// 		return compareFileNames(statA.name, statB.name);

		// 	default: /* 'default', 'mixed', 'filesFirst' */
		// 		return compareFileNames(statA.name, statB.name);
		// }
    }
}

export interface ITreeNode<T extends vscode.TreeItem = vscode.TreeItem> {
    readonly treeItem: T;
    readonly parent?: vscode.TreeItem;
    getChildren(): Promise<ITreeNode[]>;
    delete(): Promise<void>;
}
