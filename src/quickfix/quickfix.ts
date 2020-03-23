/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';
import { IQuickFix } from '../model/model';
import * as fs from 'fs-extra';

export async function applyReplaceQuickfix(quickfix: IQuickFix): Promise<void> {
    const issue = quickfix.issue as any;
    const config = issue.configuration;
    if (quickfix.type === 'REPLACE' && issue.lineNumber) {
        const file = vscode.Uri.parse(`quickfixed://${config.id}/${quickfix.issue.id}?${quickfix.id}`);
        const doc = await vscode.workspace.openTextDocument(file);
        let edit = new vscode.WorkspaceEdit();
        const lineNumber = issue.lineNumber-1;
        const end = doc.lineAt(lineNumber).range.end;
        edit.delete(file, new vscode.Range(lineNumber, 0, lineNumber, end.character));
        await vscode.workspace.applyEdit(edit);
        edit = new vscode.WorkspaceEdit();
        const replacement = issue.quickfixedLines[quickfix.id];
        edit.replace(file, new vscode.Range(lineNumber, 0, lineNumber, replacement.length), replacement);
        await vscode.workspace.applyEdit(edit);
        fs.writeFileSync(issue.file, doc.getText());
    }
}