/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IQuickFix, IIssue } from "../model/model";
import { createRandomFile } from './utils';
import * as fs from 'fs';
import * as vscode from 'vscode';

export class Diff {

    static async compare(quickfix: IQuickFix): Promise<any> {
        try {
            const issue = quickfix.issue;
            const file = vscode.Uri.parse(issue.file);
            var content = fs.readFileSync(file.fsPath, 'utf8');
            const tmp = await createRandomFile(content);
            const written = await Diff.writeTemp(tmp, quickfix, issue);
            if (!written) {
                throw new Error('Unable to write quickfix file.');
            }
            await Diff.openDiff(file, tmp);
        }
        catch (e) {
            const msg = `Quickfix Error - ${e}`;
            console.log(msg);
            vscode.window.showErrorMessage(msg);
        }        
    }

    static writeTemp(file: vscode.Uri, quickfix: IQuickFix, issue: IIssue): Thenable<boolean> {
        const edit = new vscode.WorkspaceEdit();
        if (quickfix.type === 'REPLACE') {
            // edit.insert(file, new vscode.Position(issue.lineNumber, issue.column), quickfix.replacementString);
            return vscode.workspace.applyEdit(edit);
        }
    }

    static async openDiff(original: vscode.Uri, modified: vscode.Uri): Promise<any> {
        return vscode.commands.executeCommand('vscode.diff', original, modified, 'Quickfix Preview', {preview: true});
    }
}