/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { TreeItem, Uri, TreeItemCollapsibleState, Command } from 'vscode';
import { IIssue, IQuickFix, IssueContainer } from '../model/model';
import * as path from 'path';
import { Quickfix } from '../quickfix/quickfix';
import { ModelService } from '../model/modelService';

export class QuickfixItem extends TreeItem implements IssueContainer {

    id: string = ModelService.generateUniqueId();
    collapsibleState: TreeItemCollapsibleState = TreeItemCollapsibleState.None;

    private quickfix: IQuickFix;

    constructor(quickfix: IQuickFix) {
        super(quickfix.name);
        this.quickfix = quickfix;
        this.refresh();
    }

    delete(): void {
    }

    private getIconPath(): string | Uri | { light: string | Uri; dark: string | Uri } | undefined {
        const base = [__dirname, '..', '..', '..', 'resources'];
        if (this.quickfix.quickfixApplied) {
            return process.env.CHE_WORKSPACE_NAMESPACE ? 'fa medium-green fa-check' :  {
                light: path.join(...base, 'light', 'complete.svg'),
                dark: path.join(...base, 'dark', 'complete.svg')
            };
        }
        return process.env.CHE_WORKSPACE_NAMESPACE ? 'fa fa-question-circle-o medium-blue' : {
            light: path.join(...base, 'light', 'status-info.svg'),
            dark: path.join(...base, 'dark', 'status-info-inverse.svg')
        };
    }

    public get tooltip(): string {
        return this.quickfix.id;
    }

    public get commandId(): string {
        return 'rhamt.previewQuickfix';
    }

    public getIssue(): IIssue {
        return this.quickfix.issue;
    }

    public setComplete(): void {
    }

    public get command(): Command {
        return {
            command: 'rhamt.previewQuickfix',
            title: '',
            arguments: [this.quickfix]
        };
    }

    public get contextValue(): string {
        const hasQuickix = this.quickfix.quickfixApplied ? '' : '-hasQuickfix';
        return Quickfix.TYPE + hasQuickix;
        // return Quickfix.TYPE;
    }

    public refresh(): void {
        this.iconPath = this.getIconPath();
        this.label = `${this.quickfix.name} [type: ${new String(this.quickfix.type).toLowerCase()}]`;
    }
}