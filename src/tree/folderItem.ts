/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { TreeItem, TreeItemCollapsibleState, Uri } from 'vscode';
import { ModelService } from '../model/modelService';
import * as path from 'path';

export class FolderItem extends TreeItem {

    id: string = ModelService.generateUniqueId();
    collapsibleState: TreeItemCollapsibleState = TreeItemCollapsibleState.None;
    iconPath: string | Uri | { light: string | Uri; dark: string | Uri } | undefined;

    private folder: string;

    constructor(folder: string) {
        super(folder);
        this.folder = folder;
        this.refresh();
    }

    public refresh(): void {
        this.label = path.basename(this.folder);
        this.collapsibleState = TreeItemCollapsibleState.Collapsed;
    }
}