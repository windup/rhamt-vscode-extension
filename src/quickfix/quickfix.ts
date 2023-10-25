/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';
import { ChangeType, IHint, IQuickFix, IssueContainer } from '../server/analyzerModel';
import * as fs from 'fs-extra';
import { Diff } from './diff';

export async function applyQuickfixes(quickfixes: IQuickFix[]): Promise<any> {
    // TODO: sort by file and line number. 
    // Then  apply all quickfixes to each file at one time then save the file once.
    const sortedQuickfixes = quickfixes.sort(Quickfix.compareQuickfix);
    var count = 0;
    console.log('Quickfixes: ' + quickfixes.length);
    console.log('Sorted Quickfixes: ' + sortedQuickfixes.length);
    
    for (let quickfix of sortedQuickfixes) {
        if (quickfix.quickfixApplied) {
            continue;
        }
        try {
            console.log('start apply quickfix: ' + count++);
            await applyQuickfix(quickfix);
            // update other quickfixes on this same line who's column might have been moved as a result of this quickfix change.
            // Quickfix.updateSiblingQuickfixes(quickfix);
            Quickfix.doApplyQuickfix(quickfix);
            console.log('end apply quickfix');
        }
        catch (e) {
            console.log('error applying quickfix');
            console.log(e);
            vscode.window.showErrorMessage('Error applying quickfix. See log');
        }
    }
    console.log('Done applying quickfixes.');
    
}

export async function applyQuickfix(quickfix: IQuickFix): Promise<any> {
    // apply workspace edit
    try {
        const config = quickfix.issue.configuration;
        const file = vscode.Uri.parse(`quickfixed://${config.id}/${quickfix.issue.id}?${quickfix.id}`);
        const doc = await vscode.workspace.openTextDocument(file);
        await Diff.writeQuickfix(file, quickfix, quickfix.issue as IHint, doc);
        // save changes to disk
        return fs.writeFileSync(quickfix.file, doc.getText());
    } catch (e) {
        console.log(e);
        vscode.window.showErrorMessage('Error applying quickfix. See log.');
    }
}

export namespace Quickfix {
    export const TYPE = 'quickfix';
    export const CONTAINER = 'quickfix-container';

    export interface IQuickfixContainer extends IssueContainer {
        getQuickfixes(): IQuickFix[];
    }

    export function compareQuickfix(node1: IQuickFix, node2: IQuickFix): number {
        const a = (node1.issue as IHint).lineNumber || 0;
        const b = (node2.issue as IHint).lineNumber || 0;
        // sort by line number
        if (a !== b) {
            return a < b ? -1 : 1;
        }
        // if same line, sort by column
        else {
            let col1 = (node1.issue as IHint).column || 0;
            let col2 = (node2.issue as IHint).column || 0;
            if (col1 !== col2) {
                return col1 < col2 ? -1 : 1;
            }
        }
        return 0;
    }

    export function doApplyQuickfix(quickfix: IQuickFix, applied: boolean = true) {
        quickfix.quickfixApplied = applied;
        quickfix.issue.complete = applied;
        quickfix.issue.configuration.onChanged.emit({
            type: ChangeType.QUICKFIX_APPLIED,
            name: 'quickfix',
            value: quickfix.id
        });
    }

    export function updateSiblingQuickfixes(appliedQuickfix: IQuickFix): IQuickFix[] | undefined {        
        // Only update other quickfixes on the modified line if it's of type REPLACE
        if (appliedQuickfix.type !== 'REPLACE') return undefined;
        const allHints = appliedQuickfix.issue.configuration.results.model.hints;
        const siblingHints = allHints.filter(hint => {
            // If same file, same line, and column is after the applied quickfix column.
            if (hint.file === appliedQuickfix.file && 
                    hint.lineNumber === (appliedQuickfix.issue as IHint).lineNumber &&
                        hint.column > (appliedQuickfix.issue as IHint).column) {
                return hint;
            }
        // A hint can have more than one quickfix
        });
        let siblingQuickfixes: IQuickFix[] = [];
        siblingHints.forEach(hint => siblingQuickfixes.push(...hint.quickfixes));
        // Sort quickfixes based off their column index
        const sortedQuickfixes = siblingQuickfixes.sort(Quickfix.compareQuickfix);

        let changeLength = appliedQuickfix.searchString.length - appliedQuickfix.replacementString.length;

        // If no change in string length we don't impact other quickfixes.
        if (changeLength === 0) return undefined;

        // The results list of sibling quickfixes that have changed as a result of this quickfix being applied.
        const changedQuickfixes = [];

        for (let quickfix of sortedQuickfixes) {
            // ignore the quickfix that was just applied
            if (quickfix.id === appliedQuickfix.id) continue;
            
            const quickfixHint = quickfix.issue as IHint;
            const quickfixColumn = quickfixHint.column;
            if (quickfixColumn <= 0) continue;
            quickfixHint.column = quickfixColumn + -changeLength;
            changedQuickfixes.push(quickfix);
        }
        return changedQuickfixes;
    }

    export async function applyAllQuickfixes(item: any): Promise<any> {
        return Promise.resolve();
    }
}
