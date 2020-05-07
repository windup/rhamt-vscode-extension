/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { TreeItem, TreeItemCollapsibleState, Uri } from 'vscode';
import { IHint, IQuickFix } from '../model/model';
import { Quickfix } from '../quickfix/quickfix';
import { ModelService } from '../model/modelService';

export class QuickfixesItem extends TreeItem {

    id: string = ModelService.generateUniqueId();
    collapsibleState: TreeItemCollapsibleState = TreeItemCollapsibleState.None;
    iconPath: string | Uri | { light: string | Uri; dark: string | Uri } | undefined;

    quickfixes: IQuickFix[];

    constructor(hint: IHint) {
        super(hint.id);
        this.quickfixes = hint.quickfixes;
    }

    public refresh(count: number): void {
        this.label = `Quickfixes (${count})`;
        this.collapsibleState = TreeItemCollapsibleState.Collapsed;
    }

    public get contextValue(): string {
        return Quickfix.CONTAINER;
    }
}