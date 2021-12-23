/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';
import { IHint, IQuickFix, IssueContainer } from '../model/model';
import * as fs from 'fs-extra';
import { Diff } from './diff';
import { doApplyQuickfix } from '../source/quickfix';

export async function applyQuickfixes(quickfixes: IQuickFix[]): Promise<any> {
    // TODO: sort by file and line number. 
    // Then  apply all quickfixes to each file at one time then save the file once.
    const sortedQuickfixes = quickfixes.sort(compareQuickfix);
    for (let quickfix of sortedQuickfixes) {
        await applyQuickfix(quickfix);
        doApplyQuickfix(quickfix);
    }
}

function compareQuickfix(node1: IQuickFix, node2: IQuickFix): number {
    const one = (node1.issue as IHint).lineNumber;
    const other = (node2.issue as IHint).lineNumber;
    const a = one || 0;
    const b = other || 0;
    if (a !== b) {
        return a < b ? -1 : 1;
    }
    return 0;
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

    export async function applyAllQuickfixes(item: any): Promise<any> {
        return Promise.resolve();
    }
}
