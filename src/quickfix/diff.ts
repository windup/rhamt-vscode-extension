/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IQuickFix, IIssue } from "../model/model";
import * as fs from 'fs';
import * as vscode from 'vscode';

export class Diff {

    static async compare(quickfix: IQuickFix): Promise<any> {
        try {
            const issue = quickfix.issue;
            const file = vscode.Uri.file(issue.file);
            var content = fs.readFileSync(file.fsPath, 'utf8');       
            const modified = file.with({query: JSON.stringify(content)});
            await Diff.openDiff(file, modified, quickfix, issue);
        }
        catch (e) {
            const msg = `Quickfix Error - ${e}`;
            console.log(msg);
            vscode.window.showErrorMessage(msg);
        }        
    }

    static async writeTemp(file: vscode.Uri, quickfix: IQuickFix, issue: any, editor: vscode.TextEditor): Promise<boolean> {
        if (quickfix.type === 'REPLACE' && issue.lineNumber) {
            let edit = new vscode.WorkspaceEdit();
            const lineNumber = issue.lineNumber-1;
            const end = editor.document.lineAt(lineNumber).range.end;
            edit.delete(file, new vscode.Range(lineNumber, 0, lineNumber, end.character));
            await vscode.workspace.applyEdit(edit);
            edit = new vscode.WorkspaceEdit();            
            edit.replace(file, new vscode.Range(lineNumber, 0, lineNumber, issue.quickfixedLine.length), issue.quickfixedLine);
            return vscode.workspace.applyEdit(edit);
        }
        // TODO: Delete Line
        // TODO: Insert Line
    }

    static async openDiff(original: vscode.Uri, modified: vscode.Uri, quickfix: IQuickFix, issue: IIssue): Promise<any> {
        await vscode.commands.executeCommand('vscode.diff', original, modified, 'Current ⟷ Quickfix', {
            preview: false
        });
        const textEditor = vscode.window.visibleTextEditors.filter(e => e.document.uri.toString() === original.toString())[0];
        if (!textEditor) {
            const msg = `could not file diff editor for quickfix file`;
            console.log(msg);
            vscode.window.showErrorMessage(msg);
            return;
        }
        const written = await Diff.writeTemp(modified, quickfix, issue, textEditor);
        if (!written) {
            const msg = `could not write quickfix file`;
            console.log(msg);
            vscode.window.showErrorMessage(msg);
        }
    }
}