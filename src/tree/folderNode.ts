/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { EventEmitter } from 'vscode';
import { AbstractNode, ITreeNode } from './abstractNode';
import { DataProvider } from './dataProvider';
import { RhamtConfiguration, IQuickFix } from '../server/analyzerModel';
import { ModelService } from '../model/modelService';
import { FolderItem } from './folderItem';
import { ConfigurationNode } from './configurationNode';
import * as path from 'path';
import { SortUtil } from './sortUtil';

export class FolderNode extends AbstractNode<FolderItem> {

    private loading: boolean = false;

    folder: string;
    private children = [];
    quickfixes: IQuickFix[];

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
    }

    createItem(): FolderItem {
        this.treeItem = new FolderItem(this.folder);
        this.loading = false;
        this.updateIcon('default_folder.svg');
        const unsorted = this.root.getChildNodes(this);
        this.children = unsorted.sort(SortUtil.sort);
        this.treeItem.refresh();
        return this.treeItem;
    }

    delete(): Promise<void> {
        return Promise.resolve();
    }

    getLabel(): string {
        return path.basename(this.folder);
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
        this.treeItem.iconPath = process.env.CHE_WORKSPACE_NAMESPACE ? 'fa fa-folder' : {
            light: path.join(...base, 'light', name),
            dark: path.join(...base, 'dark', name)
        };
    }
}
