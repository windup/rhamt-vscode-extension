/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { TreeItem, TreeItemCollapsibleState, Uri } from 'vscode';
import { Quickfix } from '../quickfix/quickfix';


export class HintsItem extends TreeItem {

    collapsibleState: TreeItemCollapsibleState = TreeItemCollapsibleState.None;
    iconPath: string | Uri | { light: string | Uri; dark: string | Uri } | undefined;

    private hasQuickfixes: boolean;

    constructor(file: string, hasQuickfixes: boolean) {
        super(file);
        this.hasQuickfixes = hasQuickfixes;
    }

    public refresh(count: number): void {
        this.label = `Hints (${count})`;
        this.collapsibleState = TreeItemCollapsibleState.Collapsed;
    }

    public get contextValue(): string {
        return this.hasQuickfixes ? Quickfix.CONTAINER : undefined;
    }
}