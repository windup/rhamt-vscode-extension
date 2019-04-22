import { TreeDataProvider, Disposable, EventEmitter, Event, TreeItem, commands } from 'vscode';
import { localize } from './localize';
import * as path from 'path';
import { ConfigurationNode, Grouping } from './configurationNode';
import { ITreeNode } from './abstractNode';
import { ModelService } from '../model/modelService';

export class DataProvider implements TreeDataProvider<ITreeNode>, Disposable {

    private _onDidChangeTreeDataEmitter: EventEmitter<ITreeNode> = new EventEmitter<ITreeNode>();
    private _onNodeCreateEmitter: EventEmitter<ITreeNode> = new EventEmitter<ITreeNode>();

    private _disposables: Disposable[] = [];

    constructor(private grouping: Grouping, private modelService: ModelService) {
        this._disposables.push(this.modelService.onModelLoaded(m => {
            this.refresh(undefined);
        }));
        commands.registerCommand('rhamt.modelReload', () => {
            this.refresh(undefined);
        });
    }

    public dispose(): void {
        for (const disposable of this._disposables) {
            disposable.dispose();
        }
    }

    public get onDidChangeTreeData(): Event<ITreeNode> {
        return this._onDidChangeTreeDataEmitter.event;
    }

    public get onNodeCreate(): Event<ITreeNode> {
        return this._onNodeCreateEmitter.event;
    }

    public getTreeItem(node: ITreeNode): TreeItem {
        if (node instanceof TreeItem && !node.treeItem) {
            return node;
        }
        return node.treeItem;
    }

    public async getChildren(node?: ITreeNode): Promise<any[]> {
        try {
            return this.doGetChildren(node);
        } catch (error) {
            const item = new TreeItem(localize('errorNode', 'Error: {0}', error));
            item.contextValue = 'rhamtextensionui.error';
            return Promise.resolve([item]);
        }
    }

    private async doGetChildren(node?: ITreeNode): Promise<ITreeNode[]> {

        let result: ITreeNode[];

        if (node) {
            result = await node.getChildren();
        } else {
            result = await this.populateRootNodes();
        }

        return result;
    }

    public async refresh(node?: ITreeNode): Promise<void> {
        this._onDidChangeTreeDataEmitter.fire(node);
    }

    private async populateRootNodes(): Promise<any[]> {

        let nodes: any[];

        if (this.modelService.loaded) {
            nodes = this.modelService.model.configurations.map(config => {
                return new ConfigurationNode(
                    config,
                    this.grouping,
                    this.modelService,
                    this._onNodeCreateEmitter,
                    this);
            });
        }

        else {
            const item = new TreeItem(localize('loadingNode', 'Loading...'));
            item.iconPath = {
                light: path.join(__dirname, '..', '..', '..', 'resources', 'light', 'Loading.svg'),
                dark:  path.join(__dirname, '..', '..', '..', 'resources', 'dark', 'Loading.svg')
            };
            nodes = [item];
            (async () => setTimeout(() => {
                this.modelService.load().catch(e => {
                    console.log('error while loading model service.');
                    console.log(e);
                });
            }, 500))();
        }
        return nodes;
    }
}