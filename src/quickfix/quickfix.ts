/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';
import { IQuickFix, IssueContainer } from '../model/model';
import * as fs from 'fs-extra';
import { Diff } from './diff';

export async function applyQuickfixes(quickfixes: IQuickFix[]): Promise<any> {
    for (let quickfix of quickfixes) {
        await applyQuickfix(quickfix);
    }
}

export async function applyQuickfix(quickfix: IQuickFix): Promise<any> {
    const config = quickfix.issue.configuration;
    const file = vscode.Uri.parse(`quickfixed://${config.id}/${quickfix.issue.id}?${quickfix.id}`);
    const doc = await vscode.workspace.openTextDocument(file);
    await Diff.writeQuickfix(file, quickfix, quickfix.issue, doc);
    return fs.writeFileSync(quickfix.file, doc.getText());
}

export namespace Quickfix {
    export const TYPE = 'quickfix';
    export const CONTAINER = 'quickfix-container';

    export interface IQuickfixContainer extends IssueContainer {
        getQuickfixes(): IQuickFix[];
    }
}
