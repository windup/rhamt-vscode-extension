/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';
import { ChangeType, IHint, IQuickFix, IssueContainer } from '../model/model';
import * as fs from 'fs-extra';
import { Diff } from './diff';

export async function applyQuickfixes(quickfixes: IQuickFix[]): Promise<any> {
    // TODO: sort by file and line number. 
    // Then  apply all quickfixes to each file at one time then save the file once.
    const sortedQuickfixes = quickfixes.sort(Quickfix.compareQuickfix);
    for (let quickfix of sortedQuickfixes) {
        await applyQuickfix(quickfix);
        // update other quickfixes on this same line who's column might have been moved as a result of this quickfix change.
        Quickfix.updateSiblinQuickfixes(quickfix);
        Quickfix.doApplyQuickfix(quickfix);
    }
}

export async function applyQuickfix(quickfix: IQuickFix): Promise<any> {
    const config = quickfix.issue.configuration;
    const file = vscode.Uri.parse(`quickfixed://${config.id}/${quickfix.issue.id}?${quickfix.id}`);
    const doc = await vscode.workspace.openTextDocument(file);
    // apply workspace edit
    await Diff.writeQuickfix(file, quickfix, quickfix.issue, doc);
    // save changes to disk
    return fs.writeFileSync(quickfix.file, doc.getText());
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
        quickfix.issue.configuration.markQuickfixApplied(quickfix, applied);
        quickfix.issue.complete = applied;
        quickfix.issue.configuration.markIssueAsComplete(quickfix.issue, applied);
        quickfix.issue.configuration.onChanged.emit({
            type: ChangeType.QUICKFIX_APPLIED,
            name: 'quickfix',
            value: quickfix.id
        });
    }

    export function updateSiblinQuickfixes(appliedQuickfix: IQuickFix): IQuickFix[] | undefined {        
        // Only update other quickfixes on the modified line if it's of type REPLACE
        if (appliedQuickfix.type !== 'REPLACE') return undefined;
        // We can only update other quickfixes if we know how it changed the original line of code.
        // TODO: If we hadn't eagerly computed this information, we could have compared the change it made
        // at runtime after the quickfix modifies the line of code. This would help to prevent needing to
        // compute this info after each anlsysi causing unnecessary file io. 
        const appliedHint = appliedQuickfix.issue as IHint;
        if (!appliedHint.quickfixedLines[appliedQuickfix.id]) return undefined;

        // Get all quickfixes on the same line as the appliedQuickfix
        const allHints = appliedQuickfix.issue.configuration.results.model.hints;
        const siblingHints = allHints.filter(hint => {
            // If same file and same line
            if (hint.file === appliedQuickfix.file && 
                    hint.lineNumber === (appliedQuickfix.issue as IHint).lineNumber) {
                return hint;
            }
        // A hint can have more than one quickfix
        });
        let siblingQuickfixes: IQuickFix[] = [];
        siblingHints.forEach(hint => siblingQuickfixes.push(...hint.quickfixes));
        // Now that we have all the quickfixes on this same line,
        // sort the quickfixes based off their column index
        const sortedQuickfixes = siblingQuickfixes.sort(Quickfix.compareQuickfix);
        // Was the original line of code empty
        const originalLineLength = appliedHint.originalLineSource.length;

        // Why is this returning here if negative number?
        if (!originalLineLength) return undefined;

        // How many characters has the applied quickfix added or removed from the line of code.
        const modifiedLineLength = appliedHint.quickfixedLines[appliedQuickfix.id].length;

        // Examples:
        // originalLineLength = 10
        // modifiedLineLength = 8
        // difference = originalLineLength - modifiedLineLength // 2
        //
        // originalLineLength = 8
        // modifiedLineLength = 12
        // difference = originalLineLength - modifiedLineLength // -4        
        
        const changeLength = originalLineLength - modifiedLineLength;
        if (changeLength === 0) return undefined;

        // The results list of sibling quickfixes that have changed as a result of this quickfix being applied.
        const changedQuickfixes = [];

        for (let quickfix of sortedQuickfixes) {
            // ignore the quickfix that was just applied
            if (quickfix.id === appliedQuickfix.id) continue;
            
            const quickfixHint = quickfix.issue as IHint;
            const quickfixColumn = quickfixHint.column;
            if (quickfixColumn <= 0) continue;

            // There will be a change because changeLength and quickfixColumn will not be `0`.
            const changeAmount = quickfixColumn - changeLength;
            quickfixHint.column += changeAmount;

            changedQuickfixes.push(quickfix);
        }

        return changedQuickfixes;
    }

    export async function applyAllQuickfixes(item: any): Promise<any> {
        return Promise.resolve();
    }
}
