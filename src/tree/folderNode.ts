/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { EventEmitter, TreeItemCollapsibleState } from 'vscode';
import { AbstractNode, ITreeNode } from './abstractNode';
import { DataProvider } from './dataProvider';
import { RhamtConfiguration } from '../model/model';
import { ModelService } from '../model/modelService';
import { FolderItem } from './folderItem';
import { ConfigurationNode } from './configurationNode';
import * as path from 'path';
import { SortUtil } from './sortUtil';

export class FolderNode extends AbstractNode<FolderItem> {

    private loading: boolean = false;

    folder: string;
    private children = [];

    constructor(
        config: RhamtConfiguration,
        folder: string,
        modelService: ModelService,
        onNodeCreateEmitter: EventEmitter<ITreeNode>,
        dataProvider: DataProvider,
        root: ConfigurationNode) {
        super(config, modelService, onNodeCreateEmitter, dataProvider);
        this.folder = folder;
        this.root = root;
        this.treeItem = this.createItem();
        this.listen();
    }

    createItem(): FolderItem {
        return new FolderItem(this.folder);
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

    private updateIcon(name: string): void {
        const base = [__dirname, '..', '..', '..', 'resources'];
        this.treeItem.iconPath = {
            light: path.join(...base, 'light', name),
            dark: path.join(...base, 'dark', name)
        };
    }

    private listen(): void {
        this.loading = true;
        this.updateIcon('Loading.svg');
        this.treeItem.collapsibleState = TreeItemCollapsibleState.None;
        super.refresh(this);
        setTimeout(() => {
            this.loading = false;
            this.refresh(this);
        }, 1000);
    }

    refresh(node?: ITreeNode): void {
        this.updateIcon('default_folder.svg');
        const unsorted = this.root.getChildNodes(this);
        this.children = unsorted.sort(SortUtil.sort);
        this.treeItem.refresh();
        super.refresh(node);
    }
}
