/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { TreeItem, TreeItemCollapsibleState, Uri } from 'vscode';

export class ResultsItem extends TreeItem {
    collapsibleState: TreeItemCollapsibleState = TreeItemCollapsibleState.None;
    iconPath: string | Uri | { light: string | Uri; dark: string | Uri } | undefined;

    constructor() {
        super('Loading results...');
    }

    public refresh(executedTimestamp: string): void {
        this.label = `Analysis Results (${executedTimestamp})`;
        this.collapsibleState = TreeItemCollapsibleState.Expanded;
    }

    public get contextValue(): string {
        return 'results';
    }
}