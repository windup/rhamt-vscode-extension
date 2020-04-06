/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';
import { IQuickFix, IssueContainer } from '../model/model';
import * as fs from 'fs-extra';
import { Diff } from './diff';

export async function applyQuickfix(quickfix: IQuickFix): Promise<any> {
    const issue = quickfix.issue as any;
    const config = issue.configuration;
    const file = vscode.Uri.parse(`quickfixed://${config.id}/${quickfix.issue.id}?${quickfix.id}`);
    const doc = await vscode.workspace.openTextDocument(file);
    await Diff.writeQuickfix(file, quickfix, issue, doc);
    return fs.writeFileSync(issue.file, doc.getText());
}

export namespace Quickfix {
    export const TYPE = 'quickfix';
    export const CONTAINER = 'quickfix-container';

    export interface IQuickfixContainer extends IssueContainer {
        getQuickfixes(): IQuickFix[];
    }
}
