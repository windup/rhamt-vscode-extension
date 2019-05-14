import * as fs from 'fs';
import * as cheerio from 'cheerio';
import { ModelService } from './modelService';
import * as open from 'opn';
import * as mkdirp from 'mkdirp';
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
            fs.readFile(location, (err, data: any) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(cheerio.load(data, {xmlMode: true, recognizeSelfClosing: true}));
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
                quickfixes: this.getQuickfixes(ele),
                file: '',
                severity: '',
                ruleId: '',
                effort: '',
                title: '',
                links: [],
                report: '',
                originalLineSource: '',
                lineNumber: 0,
                column: 0,
                length: 0,
                sourceSnippet: '',
                category: '',
                hint: '',
                getConfiguration: () => {
                    return this.config;
                },
                dom: ele
            };

            ele.children.forEach((child, i) => {
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
                        hint.category = node.nodeValue;
                    }
                    break;
                }
                case 'links': {
                    break;
                }
                case 'quickfixes': {
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

    private getQuickfixes(ele: CheerioElement): IQuickFix[] {
        const quickfixes: IQuickFix[] = [];
        return quickfixes;
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
                quickfixes: this.getQuickfixes(ele),
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
                dom: ele
            };
            ele.children.forEach((child, i) => {
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
                case 'issue-category': {
                    const node = child.children[0];
                    if (node) {
                        classification.category = node.nodeValue;
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
        this.getHints().forEach(hint => {
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

    save(out: string): Promise<void> {
        return new Promise<void> ((resolve, reject) => {
            mkdirp(require('path').dirname(out), (e: any) => {
                if (e) reject(e);
                fs.writeFile(out, this.dom.html(), null, e => {
                    if (e) reject(e);
                    else resolve();
                });
            });
        });
    }
}