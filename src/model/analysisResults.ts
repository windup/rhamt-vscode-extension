/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as fs from 'fs';
import * as cheerio from 'cheerio';
import { ModelService } from './modelService';
import * as open from 'opn';
import * as readline from 'readline';
import * as mime from 'mime-types';
import { IHint, IQuickFix, IClassification, RhamtConfiguration, IIssue, ILink } from './model';

export interface AnalysisResultsSummary {
    executedTimestamp?: string;
    executionDuration?: string;
    outputLocation?: string;
    executable?: string;
    hintCount?: number;
    classificationCount?: number;
}

export class AnalysisResultsUtil {
    static loadFromLocation(location: string): Promise<CheerioStatic> {
        return new Promise<CheerioStatic>((resolve, reject) => {
            fs.readFile(location, async (err, data: any) => {
                if (err) {
                    return reject(err);
                }
                try {
                    const results = cheerio.load(data, {xmlMode: true, recognizeSelfClosing: true});
                    return resolve(results);
                }
                catch (e) {
                    return reject(e);
                }
            });
        });
    }

    static loadFomData(data: any): CheerioStatic {
        return cheerio.load(data, {xmlMode: true, recognizeSelfClosing: true});
    }

    static save(dom: CheerioStatic, location: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            fs.writeFile(location, dom.xml(), null, e => {
                if (e) reject(e);
                else resolve();
            });
        });
    }

    static openReport(report: string): void {
        open(report);
    }
}

export class AnalysisResults {

    reports: Map<string, string> = new Map<string, string>();
    config: RhamtConfiguration;
    dom: CheerioStatic;

    constructor(config: RhamtConfiguration, dom: CheerioStatic) {
        this.config = config;
        this.dom = dom;
        this.loadReports();
    }

    loadReports(): void {
        this.dom('report-links').children().each((i, ele) => {
            const link: any = {};
            ele.children.forEach((child, i) => {
                switch (child.name) {
                case 'input-file': {
                    const node = child.children[0];
                    if (node) {
                        link.input = node.nodeValue;
                    }
                    break;
                }
                case 'report-file': {
                    const node = child.children[0];
                    if (node) {
                        link.report = node.nodeValue;
                    }
                    break;
                }
                }
            });
            this.reports.set(link.input, link.report);
        });
    }

    getHints(): IHint[] {
        const hints: IHint[] = [];

        this.dom('hints').children().each((i, ele) => {
            if (this.dom(ele).attr('deleted')) {
                return;
            }
            const id = ModelService.generateUniqueId();
            const hint: IHint = {
                id,
                quickfixes: [],
                file: '',
                severity: '',
                ruleId: '',
                effort: '',
                title: '',
                links: [],
                report: '',
                originalLineSource: '',
                quickfixedLine: '',
                lineNumber: 0,
                column: 0,
                length: 0,
                sourceSnippet: '',
                category: '',
                hint: '',
                getConfiguration: () => {
                    return this.config;
                },
                dom: ele,
                complete: false
            };
            if (this.dom(ele).attr('complete')) {
                hint.complete = true;
            }
            ele.children.forEach(async (child, i) => {
                switch (child.name) {
                case 'title': {
                    const node = child.children[0];
                    if (node) {
                        hint.title = node.nodeValue;
                    }
                    break;
                }
                case 'effort': {
                    const node = child.children[0];
                    if (node) {
                        hint.effort = node.nodeValue;
                    }
                    break;
                }
                case 'file': {
                    const node = child.children[0];
                    if (node) {
                        hint.file = node.nodeValue;
                        const report = this.reports.get(hint.file);
                        if (report) {
                            hint.report = report;
                        }
                    }
                    break;
                }
                case 'hint': {
                    const node = child.children[0];
                    if (node) {
                        hint.hint = node.nodeValue;
                    }
                    break;
                }
                case 'issue-category': {
                    const node = child.children[0];
                    if (node) {
                        hint.category = node.children[0].nodeValue;
                    }
                    break;
                }
                case 'links': {
                    break;
                }
                case 'quickfixes': {
                    hint.quickfixes = await this.computeQuickfixes(child, hint);
                    break;
                }
                case 'rule-id': {
                    const node = child.children[0];
                    if (node) {
                        hint.ruleId = node.nodeValue;
                    }
                    break;
                }
                case 'length': {
                    const node = child.children[0];
                    if (node) {
                        hint.length = Number(node.nodeValue);
                    }
                    break;
                }
                case 'line-number': {
                    const node = child.children[0];
                    if (node) {
                        hint.lineNumber = Number(node.nodeValue);
                    }
                    break;
                }
                case 'column': {
                    const node = child.children[0];
                    if (node) {
                        hint.column = Number(node.nodeValue);
                    }
                    break;
                }
                }
            });
            hints.push(hint);
        });
        return hints;
    }

    private async computeQuickfixes(ele: CheerioElement, issue: IIssue): Promise<IQuickFix[]> {
        const quickfixes: IQuickFix[] = [];

        ele.children.forEach(async (child, i) => {
            switch (child.name) {
                case 'quickfix': {
                    const quickfix = await this.computeQuickfix(child, issue);
                    quickfixes.push(quickfix);
                    break;
                }
            }
        });

        return quickfixes;
    }

    private async computeQuickfix(ele: CheerioElement, issue: IIssue): Promise<IQuickFix> {
        const quickfix: IQuickFix = {
            file: issue.file,
            issue,
            id: ModelService.generateUniqueId(),
            name: '',
            newLine: '',
            replacementString: '',
            searchString: '',
            transformationId: '',
            type: 'REPLACE'
        };
        ele.children.forEach((child, i) => {
            switch (child.name) {
                case 'file': {
                    const node = child.children[0];
                    if (node) {
                        quickfix.file = node.nodeValue;
                    }
                    break;
                }
                case 'name': {
                    const node = child.children[0];
                    if (node) {
                        quickfix.name = node.nodeValue;
                    }
                    break;
                }
                case 'newLine': {
                    const node = child.children[0];
                    if (node) {
                        quickfix.newLine = node.nodeValue;
                    }
                    break;
                }
                case 'replacement': {
                    const node = child.children[0];
                    if (node) {
                        quickfix.replacementString = node.nodeValue;
                    }
                    break;
                }
                case 'search': {
                    const node = child.children[0];
                    if (node) {
                        quickfix.searchString = node.nodeValue;
                    }
                    break;
                }
                case 'type': {
                    const node = child.children[0];
                    if (node) {
                        (quickfix as any).type = node.nodeValue;
                    }
                    break;
                }
            }
        });
        if ((issue as any).lineNumber) {
            const hint = issue as IHint;
            if (!hint.originalLineSource) {
                const type = mime.lookup(hint.file);
                console.log(`mime type - ${type}`);
                if (type && type.startsWith('text')) {
                    // TODO: Hints are not serialized like configurations.
                    // so this will process every time we start up, which is not correct.
                    // we need to do this only once after the analysis, so we can refer back to it.
                    hint.originalLineSource = await this.readLine(hint.file, hint.lineNumber);
                    if (hint.originalLineSource && quickfix.type === 'REPLACE') {
                        hint.quickfixedLine = this.replace(
                            hint.originalLineSource,
                            quickfix.searchString,
                            quickfix.replacementString);
                        console.log(`quickfixedLine - ${hint.quickfixedLine}`);
                        
                    }
                }
                else {
                    console.log(`unable to read mime type ${type} of file - ${hint.file}`);
                }
            }
        }
        return quickfix;
    }

    private replace(origin, search, replacement): string {
        return origin.replace(search, replacement);
      }

    getClassifications(): IClassification[] {
        const classifications: IClassification[] = [];
        this.dom('classifications').children().each((i, ele) => {
            if (this.dom(ele).attr('deleted')) {
                return;
            }
            const id = ModelService.generateUniqueId();
            const classification = {
                id,
                quickfixes: [],
                file: '',
                severity: '',
                ruleId: '',
                effort: '',
                title: id,
                messageOrDescription: '',
                links: [],
                report: '',
                description: '',
                category: '',
                getConfiguration: () => {
                    return this.config;
                },
                dom: ele,
                complete: false
            };
            if (this.dom(ele).attr('complete')) {
                classification.complete = true;
            }
            ele.children.forEach(async (child, i) => {
                switch (child.name) {
                case 'classification': {
                    const node = child.children[0];
                    if (node) {
                        classification.title = node.nodeValue;
                    }
                    break;
                }
                case 'description': {
                    const node = child.children[0];
                    if (node) {
                        classification.description = node.nodeValue;
                    }
                    break;
                }
                case 'effort': {
                    const node = child.children[0];
                    if (node) {
                        classification.effort = node.nodeValue;
                    }
                    break;
                }
                case 'file': {
                    const node = child.children[0];
                    if (node) {
                        classification.file = node.nodeValue;
                        const report = this.reports.get(classification.file);
                        if (report) {
                            classification.report = report;
                        }
                    }
                    break;
                }
                case 'quickfixes': {
                    classification.quickfixes = await this.computeQuickfixes(child, classification);
                    break;
                }
                case 'issue-category': {
                    const node = child.children[0];
                    if (node) {
                        classification.category = node.children[0].nodeValue;
                    }
                    break;
                }
                case 'links': {
                    child.children.forEach((ele, i) => {
                        const link: ILink = {
                            id: ModelService.generateUniqueId(),
                            title: '',
                            url: ''
                        };
                        ele.children.forEach(theLink => {
                            switch (theLink.name) {
                            case 'description': {
                                const node = theLink.children[0];
                                if (node) {
                                    link.title = node.nodeValue;
                                }
                                break;
                            }
                            case 'url': {
                                const node = theLink.children[0];
                                if (node) {
                                    link.url = node.nodeValue;
                                }
                                break;
                            }
                            }
                        });
                        classification.links.push(link);
                    });
                    break;
                }
                case 'quickfixes': {
                    break;
                }
                case 'rule-id': {
                    const node = child.children[0];
                    if (node) {
                        classification.ruleId = node.nodeValue;
                    }
                    break;
                }
                }
            });
            classifications.push(classification);
        });
        return classifications;
    }

    getClassificationsFor(file: string): IClassification[] {
        const classifications = [];
        this.getClassifications().forEach(classification => {
            if (classification.file === file) {
                classifications.push(classification);
            }
        });
        return classifications;
    }

    getHintsFor(file: string): IHint[] {
        const hints = [];
        const allHints = this.getHints();
        allHints.forEach(hint => {
            if (hint.file === file) {
                hints.push(hint);
            }
        });
        return hints;
    }

    deleteIssue(issue: IIssue): void {
        this.dom(issue.dom).attr('deleted', true);
    }

    markIssueAsComplete(issue: IIssue): void {
        this.dom(issue.dom).attr('complete', true);
    }

    private readLine(file: string, lineNumber: number): Promise<string> {
        return new Promise<string>(resolve => {
            console.log(`start reading file - ${file}`);
            const input = fs.createReadStream(file);
            var myInterface = readline.createInterface({ input });
            var lineno = 0;
            myInterface.on('line', function (line) {
                if (++lineno === lineNumber) {
                    console.log(`found line - ${line}`);
                    myInterface.close();
                    input.destroy();
                    resolve(line)
                }
            });
        });
    }
}