
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class NewRulesetWizard {

    async open (): Promise<any> {
        const fileName = await vscode.window.showInputBox({value: 'custom-ruleset.rhamt.xml', placeHolder: 'File name', valueSelection: [0, 14]});
        if (vscode.workspace.workspaceFolders) {    
            const root = vscode.workspace.workspaceFolders[0].uri.fsPath;
            const file = path.join(root, fileName);
            try {
                await this.writeFile(file, this.template());
            }
            catch (e) {
                const msg = `Error writing ruleset file - ${e}`;
                console.log(msg);
                vscode.window.showErrorMessage(msg);
                return;
            }
            const document = await vscode.workspace.openTextDocument(file);
            await vscode.window.showTextDocument(document);
        }
    }

    async writeFile(file: string, template: string): Promise<any> {
        return new Promise((resolve, reject) => {
            fs.writeFile(file, template, null, e => {
                if (e) reject(e);
                else resolve();
            });
        })
    }

    template(): string {
        return `<?xml version="1.0"?>
<ruleset id="" xmlns="http://windup.jboss.org/schema/jboss-ruleset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance",
    xsi:schemaLocation="http://windup.jboss.org/schema/jboss-ruleset http://windup.jboss.org/schema/jboss-ruleset/windup-jboss-ruleset.xsd">
    <metadata>
        <description>
        </description>
        <!-- version ranges applied to from and to technologies -->
        <dependencies>
                <addon id="org.jboss.windup.rules,2.4.0.Final"/>
        </dependencies>
    </metadata>
    <rules>

    </rules>
</ruleset>
        `;
    }
}
