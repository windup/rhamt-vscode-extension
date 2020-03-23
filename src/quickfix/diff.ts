/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IQuickFix } from "../model/model";
import * as vscode from 'vscode';
import * as os from 'os';

export class Diff {

    static async openQuickfixPreview(quickfix: IQuickFix): Promise<any> {
        const config = quickfix.issue.configuration;
        const ext = /(?:\.([^.]+))?$/.exec(quickfix.issue.file)[1];
        const original = vscode.Uri.parse(`quickfix://${config.id}/${quickfix.issue.id}${ext ? '.'.concat(ext) : ''}?${quickfix.id}#left`);
        const modified = vscode.Uri.parse(`quickfix://${config.id}/${quickfix.issue.id}${ext ? '.'.concat(ext) : ''}?${quickfix.id}#right`);
        await vscode.commands.executeCommand('vscode.diff', original, modified, 'Current ⟷ Quickfix', {
            preview: true
        });
        const textEditor = vscode.window.visibleTextEditors.filter(e => {
            return e.document.uri.authority === modified.authority &&
                e.document.uri.path === modified.path &&
                    e.document.uri.query === modified.query &&
                        e.document.uri.fragment === modified.fragment;
        })[0];
        if (!textEditor) {
            const msg = `could not find diff editor for quickfix file`;
            console.log(msg);
            vscode.window.showErrorMessage(msg);
            return;
        }
        const written = await Diff.writeTemp(modified, quickfix, quickfix.issue, textEditor);
        if (!written) {
            const msg = `could not write quickfix file`;
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
            const replacement = issue.quickfixedLines[quickfix.id];
            edit.replace(file, new vscode.Range(lineNumber, 0, lineNumber, replacement.length), replacement);
            return vscode.workspace.applyEdit(edit);
        }
        if (quickfix.type === 'DELETE_LINE' && issue.lineNumber) {
            let edit = new vscode.WorkspaceEdit();
            const lineNumber = issue.lineNumber-1;
            const end = editor.document.lineAt(lineNumber).range.end;
            edit.delete(file, new vscode.Range(lineNumber, 0, lineNumber, end.character));
            return vscode.workspace.applyEdit(edit);
        }
        if (quickfix.type === 'INSERT_LINE' && issue.lineNumber) {
            const lineNumber = issue.lineNumber-1;
            const replacement = issue.originalLineSource;
            const text = editor.document.getText(new vscode.Range(lineNumber, 0, lineNumber, replacement.length));
            if (text !== replacement) {
                let edit = new vscode.WorkspaceEdit();
                edit.insert(file, new vscode.Position(lineNumber, 0), os.EOL);
                await vscode.workspace.applyEdit(edit);
                edit = new vscode.WorkspaceEdit();
                const replacement = quickfix.newLine;
                edit.replace(file, new vscode.Range(lineNumber, 0, lineNumber, replacement.length), replacement);
                return vscode.workspace.applyEdit(edit);
            }
            return Promise.resolve(true);
        }
    }
}