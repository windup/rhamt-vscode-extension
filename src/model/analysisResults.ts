import * as fs from 'fs';
import * as cheerio from 'cheerio';
import { RhamtConfiguration } from './model';
import { ModelService } from './modelService';

export type IQuickFixType = 'REPLACE' | 'DELETE_LINE' | 'INSERT_LINE' | 'TRANSFORMATION';

export interface IQuickFix extends IUniqueElement {
    type: IQuickFixType;
    searchString: string;
    replacementString: string;
    newLine: string;
    transformationId: string;
    name: string;
    file: string;
}

export interface IUniqueElement {
    id: string;
}

export interface ILink extends IUniqueElement {
    description: string;
    url: string;
}

export interface IIssue extends IUniqueElement {
    quickfixes: IQuickFix[];
    file: string;
    severity: string;
    ruleId: string;
    effort: string;
    title: string;
    messageOrDescription: string;
    links: ILink[];
    report: string;
}

export interface IHint extends IIssue {
    originalLineSource: string;
    lineNumber: number;
    column: number;
    length: number;
    sourceSnippet: string;
}

export interface IClassification extends IIssue {
    description: string;
}

export interface AnalysisResultsSummary {
    id: string;
    executedTimestamp?: string;
    executionDuration?: string;
    outputLocation?: string;
    reportLocation?: string;
    hintCount?: number;
    classificationCount?: number;
}

export class AnaysisResultsUtil {

    static async readAnalysisResults(config: RhamtConfiguration): Promise<any> {
        return AnaysisResultsUtil.loadFromLocation(config.options['output']).then(dom => {
            const summary: AnalysisResultsSummary = {
                id: ModelService.generateUniqueId(),
                outputLocation: config.options['output'],
                reportLocation: config.report
            };
            config.results = new AnalysisResults(config, dom, summary);
        });
    }

    static loadFromLocation(location: string): Promise<CheerioStatic> {
        return new Promise<CheerioStatic>((resolve, reject) => {
            fs.exists(location, exists => {
                if (exists) {
                    fs.readFile(location, (err, data: any) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(cheerio.load(data));
                        }
                    });
                }
                else {
                    reject();
                }
            });
        });
    }

    static loadFomData(data: any): CheerioStatic {
        return cheerio.load(data);
    }

    static save(dom: CheerioStatic, location: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            fs.writeFile(location, dom.xml(), null, e => {
                if (e) reject(e);
                else resolve();
            });
        });
    }
}

export class AnalysisResults {

    config: RhamtConfiguration;
    dom: CheerioStatic;
    summary: AnalysisResultsSummary;

    constructor(config: RhamtConfiguration, dom: CheerioStatic, summary: AnalysisResultsSummary) {
        this.config = config;
        this.dom = dom;
        this.summary = summary;
    }

    getHints(): IHint[] {
        const hints: IHint[] = [];
        this.dom('hints').children().each((i, ele) => {
            const id = ModelService.generateUniqueId();
            const hint: IHint = {
                id,
                quickfixes: this.getQuickfixes(ele),
                file: '',
                severity: '',
                ruleId: '',
                effort: '',
                title: '',
                messageOrDescription: '',
                links: [],
                report: '',
                originalLineSource: '',
                lineNumber: 0,
                column: 0,
                length: 0,
                sourceSnippet: ''
            };
            ele.children.forEach(child => {
                switch (child.name) {
                case 'column': {
                    hint.column = Number(child.children[0].nodeValue);
                    break;
                }
                case 'title': {
                    hint.title = child.children[0].nodeValue;
                    break;
                }
                case 'message': {
                    hint.messageOrDescription = child.children[0].nodeValue;
                    break;
                }
                case 'effort': {
                    hint.effort = child.children[0].nodeValue;
                    break;
                }
                case 'file': {
                    hint.file = child.children[0].nodeValue;
                    break;
                }
                case 'hint': {
                    hint.messageOrDescription = child.children[0].nodeValue;
                    break;
                }
                case 'issue-category': {
                    break;
                }
                case 'links': {
                    break;
                }
                case 'quickfixes': {
                    break;
                }
                case 'rule-id': {
                    hint.ruleId = child.children[0].nodeValue;
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
                description: ''
            };
            ele.children.forEach(child => {
                switch (child.name) {
                case 'classification': {
                    classification.title = child.children[0].nodeValue;
                    break;
                }
                case 'description': {
                    classification.description = child.children[0].nodeValue;
                    break;
                }
                case 'effort': {
                    classification.effort = child.children[0].nodeValue;
                    break;
                }
                case 'file': {
                    classification.file = child.children[0].nodeValue;
                    break;
                }
                case 'issue-category': {
                    break;
                }
                case 'links': {
                    break;
                }
                case 'quickfixes': {
                    break;
                }
                case 'rule-id': {
                    classification.ruleId = child.children[0].nodeValue;
                    break;
                }
                }
            });
            classifications.push(classification);
        });
        return classifications;
    }
}