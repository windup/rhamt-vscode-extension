/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { TreeItem, Uri, TreeItemCollapsibleState, Command } from 'vscode';
import { ModelService } from '../model/modelService';
import { IIssue, IssueContainer, IQuickFix } from '../model/model';
import * as path from 'path';

export class QuickfixItem extends TreeItem implements IssueContainer {

    private _id: string = ModelService.generateUniqueId();
    collapsibleState: TreeItemCollapsibleState = TreeItemCollapsibleState.None;

    quickfix: IQuickFix;

    constructor(quickfix: IQuickFix) {
        super(quickfix.name);
        this.quickfix = quickfix;
        this.refresh();
    }

    delete(): void {
    }

    private getIconPath(): string | Uri | { light: string | Uri; dark: string | Uri } | undefined {
        const base = [__dirname, '..', '..', '..', 'resources'];
        return process.env.CHE_WORKSPACE_NAMESPACE ? 'fa fa-question-circle-o medium-blue' : {
            light: path.join(...base, 'light', 'status-info.svg'),
            dark: path.join(...base, 'dark', 'status-info-inverse.svg')
        };
    }

    public get id(): string {
        return this._id;
    }

    public get tooltip(): string {
        return this.quickfix.id;
    }

    public get commandId(): string {
        return 'rhamt.previewQuickfix';
    }

    public getIssue(): IIssue {
        return this.quickfix.hint;
    }

    public setComplete(): void {
    }

    public get command(): Command {
        return process.env.CHE_WORKSPACE_NAMESPACE ? undefined : {
            command: 'rhamt.previewQuickfix',
            title: '',
            arguments: [this.quickfix]
        };
    }

    public get contextValue(): string {
        return 'quickfix';
    }

    public refresh(): void {
        this.iconPath = this.getIconPath();
        this.label = `${this.quickfix.name} [id: ${this.quickfix.id}]`;
    }
}