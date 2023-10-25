/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Command, TreeItem, TreeItemCollapsibleState, Uri } from 'vscode';
import * as path from 'path';

export class FileItem extends TreeItem {

    collapsibleState: TreeItemCollapsibleState = TreeItemCollapsibleState.None;
    iconPath: string | Uri | { light: string | Uri; dark: string | Uri } | undefined;

    file: string;
    
    constructor(file: string) {
        super(file);
        this.file = file;
        this.refresh();
    }

    public refresh(): void {
        this.label = path.basename(this.file);
        this.collapsibleState = TreeItemCollapsibleState.Collapsed;
    }

    public get contextValue(): string {
        return undefined;
    }

    public get command(): Command {
        return {
            command: 'rhamt.openDoc',
            title: '',
            arguments: [this]
        };
    }  
}
