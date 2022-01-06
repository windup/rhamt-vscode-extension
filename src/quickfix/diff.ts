/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { IQuickFix } from "../model/model";
import * as vscode from 'vscode';
import * as os from 'os';
import { QuickfixNode } from "../tree/quickfixNode";

export class Diff {

    static computeQuixckfixDiffEditorUri(quickfix: IQuickFix, location: string): vscode.Uri {
        const config = quickfix.issue.configuration;
        const ext = /(?:\.([^.]+))?$/.exec(quickfix.issue.file)[1];
        return vscode.Uri.parse(`quickfix://${config.id}/${quickfix.issue.id}${ext ? '.'.concat(ext) : ''}?${quickfix.id}#${location}`);
    }

    static findQuickfixDiffEditor(quickfix: IQuickFix, location: string): vscode.TextEditor | undefined {
        const modified = Diff.computeQuixckfixDiffEditorUri(quickfix, location);
        const diffEditor = vscode.window.visibleTextEditors.find(e => {
            const uri = e.document.uri;
            return uri.authority === modified.authority &&
                uri.path === modified.path &&
                    uri.query === modified.query &&
                        uri.fragment === modified.fragment;
        });
        return diffEditor;
    }

    static async openQuickfixPreview(item: any): Promise<any> {
        let quickfix: IQuickFix = item instanceof QuickfixNode ? item.quickfix : item;
        const original = Diff.computeQuixckfixDiffEditorUri(quickfix, 'left');
        const modified = Diff.computeQuixckfixDiffEditorUri(quickfix, 'right');
        await vscode.commands.executeCommand('vscode.diff', original, modified, 'Current ⟷ Quickfix', {
            preview: true
        });
        const textEditor = Diff.findQuickfixDiffEditor(quickfix, 'right');
        if (!textEditor) {
            const msg = `could not find diff editor for quickfix file`;
            console.log(msg);
            vscode.window.showErrorMessage(msg);
            return;
        }
        const written = await Diff.writeQuickfix(modified, quickfix, quickfix.issue, textEditor.document);
        if (!written) {
            const msg = `could not write quickfix file`;
            console.log(msg);
            vscode.window.showErrorMessage(msg);
        }
        return textEditor;
    }

    static async writeQuickfix(file: vscode.Uri, quickfix: IQuickFix, issue: any, document: vscode.TextDocument): Promise<boolean> {
        if (quickfix.type === 'REPLACE' && issue.lineNumber) {
            let edit = new vscode.WorkspaceEdit();
            const lineNumber = issue.lineNumber-1;
            const end = document.lineAt(lineNumber).range.end;
            edit.delete(file, new vscode.Range(lineNumber, 0, lineNumber, end.character));
            await vscode.workspace.applyEdit(edit);
            edit = new vscode.WorkspaceEdit();
            const replacement = issue.quickfixedLines[quickfix.id];
            edit.replace(file, new vscode.Range(lineNumber, 0, lineNumber, replacement.length), replacement);
            return vscode.workspace.applyEdit(edit);
        }
        else if (quickfix.type === 'DELETE_LINE' && issue.lineNumber) {
            let edit = new vscode.WorkspaceEdit();
            const lineNumber = issue.lineNumber-1;
            const end = document.lineAt(lineNumber).range.end;
            edit.delete(file, new vscode.Range(lineNumber, 0, lineNumber, end.character));
            return vscode.workspace.applyEdit(edit);
        }
        else if (quickfix.type === 'INSERT_LINE' && issue.lineNumber) {
            const lineNumber = issue.lineNumber-1;
            const original = issue.originalLineSource;
            const text = document.getText(new vscode.Range(lineNumber, 0, lineNumber, original.length));
            if (text === original) {
                let edit = new vscode.WorkspaceEdit();
                edit.insert(file, new vscode.Position(lineNumber, 0), os.EOL);
                await vscode.workspace.applyEdit(edit);
                edit = new vscode.WorkspaceEdit();
                const newline = quickfix.newLine;
                edit.replace(file, new vscode.Range(lineNumber, 0, lineNumber, newline.length), newline);
                if (!newline) {
                    vscode.window.showErrorMessage(`Newline is missing from hint.`);
                }
                return vscode.workspace.applyEdit(edit);
            }
            return Promise.resolve(true);
        }
    }

    static async updateQuickfixDiffEditor(item: any): Promise<any> {
        const originalFileDiffEditor = Diff.findQuickfixDiffEditor(item.quickfix, 'left');
        const modifiedFileDiffEditor = Diff.findQuickfixDiffEditor(item.quickfix, 'right');
        if (originalFileDiffEditor && modifiedFileDiffEditor) {
            let edit = new vscode.WorkspaceEdit();
            const document = originalFileDiffEditor.document;
            edit.replace(
                document.uri,
                new vscode.Range(0, 0, document.lineCount, 0),
                modifiedFileDiffEditor.document.getText()
                );
            try {
                await vscode.workspace.applyEdit(edit);
            }
            catch(e) {
                const msg = `could not write quickfix to diff editor`;
                console.log(msg);
                vscode.window.showErrorMessage(msg);
            }
        }
    }
}
