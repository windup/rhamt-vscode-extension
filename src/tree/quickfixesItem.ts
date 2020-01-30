/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { TreeItem, TreeItemCollapsibleState, Uri } from 'vscode';
import { ModelService } from '../model/modelService';
import { IHint } from '../model/model';

export class QuickfixesItem extends TreeItem {

    id: string = ModelService.generateUniqueId();
    collapsibleState: TreeItemCollapsibleState = TreeItemCollapsibleState.None;
    iconPath: string | Uri | { light: string | Uri; dark: string | Uri } | undefined;

    constructor(hint: IHint) {
        super(hint.id);
    }

    public refresh(count: number): void {
        this.label = `Quickfixes (${count})`;
        this.collapsibleState = TreeItemCollapsibleState.Collapsed;
    }
}