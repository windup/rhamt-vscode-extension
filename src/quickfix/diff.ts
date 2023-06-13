/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { IHint, IQuickFix } from "../model/model";
import * as vscode from 'vscode';
import * as os from 'os';
import { QuickfixNode } from "../tree/quickfixNode";
import { AnalysisResults } from "../model/analysisResults";
import * as path from 'path';

import * as fs from 'fs';
import * as readline from 'readline';
import { EOL } from 'os'

function extractPomDependency(quickfix: IQuickFix, issue: IHint): Promise<Array<string>> {
    const file = quickfix.file;
    const lineNumber = issue.lineNumber;
    return new Promise<Array<string>>(resolve => {
        const input = fs.createReadStream(file);
        const myInterface = readline.createInterface({ input });
        var lineno = 0;
        let snippet = new Array<string>();
        let running = false;
        myInterface.on('line', function (line) {
            if (++lineno === lineNumber && line.includes('<dependency>')) {
                running = true;
            }
            if (running) {
                snippet.push(line);
                if (line.includes('</dependency>')) {
                    myInterface.close();
                    input.destroy();
                    running = false;
                    resolve(snippet);
                }
            }
        });
    });
}

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
        const written = await Diff.writeQuickfix(modified, quickfix, quickfix.issue as IHint, textEditor.document);
        if (!written) {
            const msg = `could not write quickfix file`;
            console.log(msg);
            vscode.window.showErrorMessage(msg);
        }
        return textEditor;
    }

    static async writeQuickfix(file: vscode.Uri, quickfix: IQuickFix, issue: IHint, document: vscode.TextDocument): Promise<boolean> {  
        if (quickfix.type === 'REPLACE' && issue.lineNumber && path.basename(issue.file) === 'pom.xml') {
            let lineNumber = issue.lineNumber;
            const line = await AnalysisResults.readLine(quickfix.file, lineNumber);
            const content = line.substring(issue.column, issue.column + issue.length);
            // If quickfix is on the line of the issue.
            // example:
            // <when>
            //    <filecontent filename="pom.xml" pattern="groupId&gt;javax&lt;" />
            //    </when>
            if (content.includes(quickfix.searchString)) {
                let edit = new vscode.WorkspaceEdit();
                let lineNumber = issue.lineNumber;
                const line = await AnalysisResults.readLine(quickfix.file, lineNumber);
                const content = line.substring(issue.column, issue.column + issue.length);
                const start = line.substring(0, issue.column);
                const end = line.substring(issue.column + issue.length, line.length);
                const newLine = start + content.replace(quickfix.searchString, quickfix.replacementString) + end;
                lineNumber = issue.lineNumber - 1;
                const endLine = document.lineAt(lineNumber).range.end;
                edit.delete(file, new vscode.Range(lineNumber, 0, lineNumber, endLine.character));
                await vscode.workspace.applyEdit(edit);
                edit = new vscode.WorkspaceEdit();
                edit.replace(file, new vscode.Range(lineNumber, 0, lineNumber, newLine.length), newLine);
                return vscode.workspace.applyEdit(edit);
            }
            // Otherwise, search the dependency tag for search string and do the replace there.
            // example:
            // <when>
            //     <project>
            //         <artifact groupId="org.jboss.spec.javax.enterprise.concurrent" artifactId="jboss-concurrency-api_1.0_spec"/>
            //     </project>
            // </when>
            else {
                const dependencyElementLines = await extractPomDependency(quickfix, issue);
                for (let index = 0; index < dependencyElementLines.length; index++) {
                    const line = dependencyElementLines[index];
                    // The primary issue here is that we don't know if we should replace groupId or artifactId based off 
                    // a quickfix.
                    // so we replace the first occurance of search string we find in the depenency entry.
                    // this maybe the groupId or artifactId depending on what matches first.
                    if (line.includes(quickfix.searchString)) {
                        dependencyElementLines[index] = line.replace(quickfix.searchString, quickfix.replacementString);
                        break;
                    }
                }
                const lineNumber = issue.lineNumber - 1;
                const endLine = document.lineAt(lineNumber).range.end;
                let edit = new vscode.WorkspaceEdit();
                edit.delete(file, new vscode.Range(lineNumber, 0, lineNumber+dependencyElementLines.length-1, endLine.character));
                await vscode.workspace.applyEdit(edit);
                edit = new vscode.WorkspaceEdit();
                edit.replace(file, new vscode.Range(lineNumber, 0, lineNumber, endLine.character), dependencyElementLines.join(EOL));
                return vscode.workspace.applyEdit(edit);
            }
        }
        else if (quickfix.type === 'REPLACE' && issue.lineNumber) {
            let edit = new vscode.WorkspaceEdit();
            let lineNumber = issue.lineNumber;
            const line = await AnalysisResults.readLine(quickfix.file, lineNumber);
            const content = line.substring(issue.column, issue.column + issue.length);
            const start = line.substring(0, issue.column);
            const end = line.substring(issue.column + issue.length, line.length);
            const newLine = start + content.replace(quickfix.searchString, quickfix.replacementString) + end;
            lineNumber = issue.lineNumber - 1;
            const endLine = document.lineAt(lineNumber).range.end;
            edit.delete(file, new vscode.Range(lineNumber, 0, lineNumber, endLine.character));
            await vscode.workspace.applyEdit(edit);
            edit = new vscode.WorkspaceEdit();
            edit.replace(file, new vscode.Range(lineNumber, 0, lineNumber, newLine.length), newLine);
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
