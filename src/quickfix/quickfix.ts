/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { IQuickFix } from '../model/model';

export function applyReplaceQuickfix(quickfix: IQuickFix): Promise<any> {
    return new Promise<any>(resolve => {
        vscode.workspace.openTextDocument(vscode.Uri.file(quickfix.file)).then(async doc => {
            const editor = await vscode.window.showTextDocument(doc);
            editor.edit(editBuilder => {
                const all = new vscode.Range(
                    doc.positionAt(0),
                    doc.positionAt(doc.getText().length)
                );
                editor.edit(eb => eb.replace(all, '')).then(resolve);
            });
        });
    });
}