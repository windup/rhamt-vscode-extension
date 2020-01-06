
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class NewRulesetWizard {

    async open (): Promise<any> {
        const fileName = await vscode.window.showInputBox({value: 'custom-ruleset.rhamt.xml', placeHolder: 'File name', valueSelection: [0, 14]});
        if (vscode.workspace.workspaceFolders) {
            const root = vscode.workspace.workspaceFolders[0].uri.fsPath;
            const location = path.join(root, fileName);
            return new Promise((resolve, reject) => {
                fs.writeFile(location, '', null, e => {
                    if (e) reject(e);
                    else resolve();
                });
            })
        }
    }
}
