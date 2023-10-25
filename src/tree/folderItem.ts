/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { TreeItem, TreeItemCollapsibleState, Uri } from 'vscode';
import * as path from 'path';

export class FolderItem extends TreeItem {

    collapsibleState: TreeItemCollapsibleState = TreeItemCollapsibleState.Expanded;
    iconPath: string | Uri | { light: string | Uri; dark: string | Uri } | undefined;

    private folder: string;

    constructor(folder: string) {
        super(folder);
        this.folder = folder;
        this.refresh();
    }

    public refresh(): void {
        this.label = path.basename(this.folder);
        this.collapsibleState = TreeItemCollapsibleState.Expanded;
    }

    public get contextValue(): string {
        return undefined;
    }
}
