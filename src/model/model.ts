/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { rhamtEvents } from '../events';
import { AnalysisResults, AnalysisResultsSummary } from './analysisResults';
import * as path from 'path';

export class RhamtModel {

    public configurations: RhamtConfiguration[] = [];

    public exists(name: string): boolean {
        for (const config of this.configurations) {
            if (config.name === name) {
                return true;
            }
        }
        return false;
    }
}

export namespace AnalysisState {
    export const ANALYZING = 0;
    export const STOPPED = 1;
    export const COMPLETED = 2;
}

export namespace ChangeType {
    export const MODIFIED = 0;
    export const ADDED    = 1;
    export const DELETED  = 2;
    export const PROGRESS = 3;
    export const CANCELLED = 4;
    export const ERROR = 5;
    export const COMPLETE = 6;
    export const STARTED = 7;
    export const CLONING = 8;
}

export interface CloneUpdate {
    readonly input: Clone;
    readonly value: number;
    readonly title: string;
    readonly description?: string;
}

export interface Input {
    id: string;
    path: string;
}

export interface Clone extends Input {
    repo: string;
    starting: boolean;
    cloning: boolean;
    cancelled: boolean;
    completed: boolean;
}

export class RhamtConfiguration {
    onChanged = new rhamtEvents.TypedEvent<{type: number, name: string, value: any}>();
    id: string;
    name: string;
    summary: AnalysisResultsSummary | undefined;
    private _results: AnalysisResults | null;
    rhamtExecutable: string;
    options: { [index: string]: any } = {};

    get results(): AnalysisResults | null {
        return this._results;
    }

    set results(results: AnalysisResults | null) {
        this._results = results;
    }

    getReport(): string {
        if (!this.options['output']) return undefined;
        return path.resolve(this.options['output'], 'index.html');
    }

    getResultsLocation(): string {
        if (!this.options['output']) return undefined;
        return path.resolve(this.options['output'], 'results.xml');
    }

    deleteIssue(issue: IIssue): void {
        this._results.deleteIssue(issue);
    }

    markIssueAsComplete(issue: IIssue): void {
        this._results.markIssueAsComplete(issue);
    }

    getQuickfixesForResource(resource: string): IQuickFix[] {
        let quickfixes = [];
        if (this._results) {
            this._results.model.hints.filter(hint => {
                if (hint.file === resource || hint.file.includes(resource)) {
                    quickfixes = quickfixes.concat(hint.quickfixes)
                }
            });
            this._results.model.classifications.filter(classification => {
                if (classification.file === resource || classification.file.includes(resource)) {
                    quickfixes = quickfixes.concat(classification.quickfixes)
                }
            });
        }
        return quickfixes;
    }
}

export interface IUniqueElement {
    id: string;
}

export interface ILink extends IUniqueElement {
    title: string;
    url: string;
}

export interface IIssue extends IUniqueElement {
    type: IIssueType;
    title: string;
    quickfixes: IQuickFix[];
    quickfixedLines: { [index: string]: any };
    originalLineSource: string;
    file: string;
    severity: string;
    ruleId: string;
    effort: string;
    links: ILink[];
    report: string;
    category: string;
    configuration: RhamtConfiguration;
    dom: any;
    complete: boolean;
}

export enum IIssueType {
    Hint,
    Classification
}
export type IQuickFixType = 'REPLACE' | 'DELETE_LINE' | 'INSERT_LINE' | 'TRANSFORMATION';

export interface IQuickFix extends IUniqueElement {
    issue: IIssue;
    type: IQuickFixType;
    searchString: string;
    replacementString: string;
    newLine: string;
    transformationId: string;
    name: string;
    file: string;
}

export interface ReportHolder {
    getReport: () => string;
}

export interface IssueContainer {
    getIssue?: () => IIssue;
    setComplete?: () => void;
}

export interface IHint extends IIssue {
    lineNumber: number;
    column: number;
    length: number;
    sourceSnippet: string;
    hint: string;
}

export interface IClassification extends IIssue {
    description: string;
}

export interface Endpoints {
    reportLocation(): Promise<string>;
    reportPort(): string;
    resourcesRoot(): any;
    configurationResourceRoot(): string;
    reportsRoot(): any;
    configurationPort(): string;
    configurationLocation(config?: RhamtConfiguration): Promise<string>;
    isReady: boolean;
    ready: Promise<void>;
}
