/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { TreeItem, TreeItemCollapsibleState, Uri } from 'vscode';

export class HintsItem extends TreeItem {

    collapsibleState: TreeItemCollapsibleState = TreeItemCollapsibleState.None;
    iconPath: string | Uri | { light: string | Uri; dark: string | Uri } | undefined;

    constructor(file: string) {
        super(file);
    }

    public refresh(count: number): void {
        this.label = `Incidents (${count})`;
        this.collapsibleState = TreeItemCollapsibleState.Collapsed;
    }

    public get contextValue(): string {
        return undefined;
    }
}