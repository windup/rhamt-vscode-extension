/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { TreeItem, TreeItemCollapsibleState, Uri } from 'vscode';
import { IHint, IQuickFix } from '../server/analyzerModel';
import { Quickfix } from '../quickfix/quickfix';

export class QuickfixesItem extends TreeItem {

    collapsibleState: TreeItemCollapsibleState = TreeItemCollapsibleState.None;
    iconPath: string | Uri | { light: string | Uri; dark: string | Uri } | undefined;

    contextValue: string = Quickfix.CONTAINER;
    quickfixes: IQuickFix[];

    constructor(hint: IHint) {
        super(hint.id);
        this.quickfixes = hint.quickfixes;
    }

    public refresh(count: number): void {
        this.label = `Quickfixes (${count})`;
        this.collapsibleState = TreeItemCollapsibleState.Collapsed;
    }

    // public get contextValue(): string {
    //     return Quickfix.CONTAINER;
    // }
}