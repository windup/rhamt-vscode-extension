/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { ModelService } from '../model/modelService';
import { IClassification, IHint, IIssue, IIssueType, IQuickFix, RhamtConfiguration } from './analyzerModel';
import * as vscode from 'vscode';

export interface AnalysisResultsSummary {
    skippedReports?: boolean;
    executedTimestamp?: string;
    executionDuration?: string;
    outputLocation?: string;
    executable?: string;
    quickfixes?: any;
    hintCount?: number,
    classificationCount?: number;
    quickfixCount?: number;
    executedTimestampRaw?: string,
    active?: boolean,
    activatedExplicity?: boolean
}

export class AnalysisResultsUtil {

    static openReport(report: string): void {
    }
}

export class AnalyzerResults {

    reports: Map<string, string> = new Map<string, string>();

    config: RhamtConfiguration;
    jsonResults: any;

    private _model: AnalyzerResults.Model;

    constructor(jsonResults: any, config: RhamtConfiguration) {
        this.jsonResults = jsonResults;
        this.config = config;
    }

    init(): Promise<void> {
        this._model = {hints: [], classifications: []};
        const rulesets = this.jsonResults[0]['rulesets'];
        rulesets.forEach(ruleset => {
            const violations = ruleset.violations;
            if (violations) {
                Object.keys(violations).forEach(violationKey => {
                    const violation = violations[violationKey];
                    const incidents = violation.incidents;                    
                    if (incidents) {
                        incidents.forEach(incident => {
                            const uriParts = (incident.uri as string).split('/');
                            console.log(uriParts);
                            const file = (incident.uri as string).replace(this.config.sourceBase(), '');
                            const root = vscode.workspace.workspaceFolders[0];
                            const fileUri = vscode.Uri.joinPath(root.uri, file);
                            try {
                                const hint = {
                                    type: IIssueType.Hint,
                                    id: ModelService.generateUniqueId(),
                                    quickfixes: [],
                                    file: fileUri.fsPath,
                                    severity: '',
                                    ruleId: violationKey,
                                    effort: '',
                                    title: '',
                                    links: [],
                                    report: '',
                                    lineNumber: incident.lineNumber,
                                    column: 0,
                                    length: 0,
                                    sourceSnippet: '',
                                    category: violation.category,
                                    hint: incident.message,
                                    configuration: this.config,
                                    dom: incident,
                                    complete: false,
                                    origin: ''
                                };
                                this.model.hints.push(hint);

                            } catch (e) {
                                console.log('error creating incident');
                                console.log(e);
                            }
                        });
                    }
                });
            }
        });       
        return Promise.resolve();
    }

    get model(): AnalyzerResults.Model | null {
        return this._model;
    }
    
    deleteIssue(issue: IIssue): void {
    }

    markIssueAsComplete(issue: IIssue, complete: boolean): void {
    }

    markQuickfixApplied(quickfix: IQuickFix, applied: boolean): void {
        if (applied) {
        }
        else {
        }
    }
}

export namespace AnalyzerResults {
    
    export interface Model {
        hints: IHint[];
        classifications: IClassification[];
    }
}

