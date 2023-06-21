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

function extractPomDependency(quickfix: IQuickFix, issue: IHint): Promise<Array<string>> {
    const file = quickfix.file;
    const lineNumber = issue.lineNumber;
    return new Promise<Array<string>>(resolve => {
        const input = fs.createReadStream(file);
        const myInterface = readline.createInterface({ input });
        var lineno = 0;
        let snippet = new Array<string>();
        let running = false;
        let resolved = false;
        myInterface.on('line', function (line) {
            if (++lineno === lineNumber && line.includes('<dependency>')) {
                console.log('Start reading <dependency> tag');
                running = true;
            }
            if (running) {
                console.log(line);
                snippet.push(line);
                if (line.includes('</dependency>')) {
                    running = false;
                    resolved = true;
                    myInterface.close();
                    input.destroy();
                    resolve(snippet);
                }
            }
        });
        myInterface.on('close', function () {
            if (!resolved) {
                resolve([]);
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
        if (quickfix.quickfixApplied) {
            vscode.window.showInformationMessage('Quickfix already applied.');
            return;
        }
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
            try {
                console.log('start replace on pom.xml');
                
                let lineNumber = issue.lineNumber;
                const line = await AnalysisResults.readLine(quickfix.file, lineNumber);
                
                console.log('Line: ' + line);                
                console.log('lineNumber: ' + lineNumber);
                console.log('Search: ' + quickfix.searchString);
                console.log('Replace: ' + quickfix.replacementString);

                // If quickfix is on the line of the issue.
                // example:
                // <when>
                //    <filecontent filename="pom.xml" pattern="groupId&gt;javax&lt;" />
                //    </when>
                if (line.includes(quickfix.searchString)) {
                    console.log('start replace on pom.xml :: content.includes ');
                    
                    if (!line.includes('<groupId>') && !line.includes('<artifactId>')) {
                        console.log('Line matching searchString does not include groupId or artifactId');
                        return;
                    }

                    var newLine = '';
                    /* if (line.includes('<groupId>')) {
                        newLine = line.replace(/<groupId>.*<\/groupId>/, `<groupId>${quickfix.replacementString}</groupId>`);                        
                    }
                    else if (line.includes('<artifactId>')){
                        newLine = line.replace(/<artifactId>.*<\/artifactId>/, `<artifactId>${quickfix.replacementString}</artifactId>`);
                    } */

                    /*
                        We're replacing searchString with replacement instead of replacing internals of tag (commented out above)
                        because the searchString might not include the entire entry for the tag, 
                        it might just be replacing part of the group or artifact ID.
                    */

                    newLine = line.replace(quickfix.searchString, quickfix.replacementString);
                    const newLineNumber = lineNumber-1;
                    console.log('NewLine: ' + newLine);
                    console.log('NewLineNumber: ' + newLineNumber);
                    let edit = new vscode.WorkspaceEdit();
                    edit.replace(file, new vscode.Range(newLineNumber, 0, newLineNumber, line.length), newLine);
                    console.log('applying edit on pom.xml');
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
                    console.log('search dependency tag...');
                    const dependencyElementLines = await extractPomDependency(quickfix, issue);
                    console.log('dependencyElementLines');
                    console.log(dependencyElementLines);
                    for (let index = 0; index < dependencyElementLines.length; index++) {
                        console.log('Searching dependency lines');
                        const line = dependencyElementLines[index];
                        console.log('line: ' + line);
                        // The primary issue here is that we don't know if we should replace groupId or artifactId based off 
                        // a quickfix.
                        // so we replace the first occurance of search string we find in the depenency entry.
                        // this maybe the groupId or artifactId depending on what matches first.
                        if (line.includes(quickfix.searchString)) {
                            console.log('line includes search string');
                            var newLine = '';
                            /* if (line.includes('<groupId>')) {
                                newLine = line.replace(/<groupId>.*<\/groupId>/, `<groupId>${quickfix.replacementString}</groupId>`);                                
                            }
                            else if (line.includes('<artifactId>')){
                                newLine = line.replace(/<artifactId>.*<\/artifactId>/, `<artifactId>${quickfix.replacementString}</artifactId>`);
                            } */
                            if (line.includes('<groupId>') || line.includes('<artifactId>')) {
                                newLine = line.replace(quickfix.searchString, quickfix.replacementString);
                            }
                            else {
                                console.log('Line matching searchString does not include groupId or artifactId');
                                return;
                            }
                            console.log('NewLine: ' + newLine);
                            
                            let edit = new vscode.WorkspaceEdit();
                            const newLineNumber = lineNumber + index - 1;
                            edit.replace(file, new vscode.Range(newLineNumber, 0, newLineNumber, line.length), newLine);
                            console.log('applying edit on pom.xml');
                            return vscode.workspace.applyEdit(edit);
                        }
                    }
                }
            } catch(e) {
                console.log('Error writting quickfix.');
                console.log(e);
                vscode.window.showErrorMessage('Error applying quickfix. See log.');
            }
            console.log('did not apply quickfix to pom.xml');
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
