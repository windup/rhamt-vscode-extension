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
import { IHint, IQuickFix, IClassification, RhamtConfiguration, IIssue, ILink, IIssueType } from './model';

export interface AnalysisResultsSummary {
    skippedReports?: boolean;
    executedTimestamp?: string;
    executionDuration?: string;
    outputLocation?: string;
    executable?: string;
    quickfixes?: any;
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

    static async loadAndPersistIDs(location: string): Promise<CheerioStatic> {
        return new Promise<CheerioStatic>(async (resolve, reject) => {
            try {
                const results = await AnalysisResultsUtil.loadFromLocation(location);

                const elements = results('hints').children();
                for (let index = 0; index < elements.length; index++) {
                    const hint = elements[index];
                    results(hint).attr('id', ModelService.generateUniqueId());
                    const quickixes = results(hint).find('quickfixes').children();
                    for (let i2 = 0; i2 < quickixes.length; i2++) {
                        results(quickixes[i2]).attr('id', ModelService.generateUniqueId());
                    }
                }
                const classifications = results('classifications').children();
                for (let index = 0; index < classifications.length; index++) {
                    const classification = classifications[index];
                    results(classification).attr('id', ModelService.generateUniqueId());
                }
                await AnalysisResultsUtil.save(results, location);
                resolve(results);
            }
            catch (e) {
                console.log(`Error while loadAndPersistIDs ${e}`);
                return reject(e);
            }
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

    private _model: AnalysisResults.Model;

    constructor(dom: CheerioStatic, config: RhamtConfiguration) {
        this.dom = dom;
        this.config = config;
    }

    async init(): Promise<AnalysisResults.Model> {
        this.loadReports();
        if (this._model) {
            return this._model;
        }
        const hints = await this.getHints();
        const classifications = await this.getClassifications();
        this._model = { hints, classifications};
        return this._model;
    }

    get model(): AnalysisResults.Model | null {
        return this._model;
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

    private async getHints(): Promise<IHint[]> {
        const hints: IHint[] = [];
        const elements = this.dom('hints').children();
        for (let index = 0; index < elements.length; index++) {
            const hint = await this.readHint(elements[index]);
            hints.push(hint);
        }
        return hints;
    }

    private async readHint(ele: any): Promise<IHint> {
        if (this.dom(ele).attr('deleted')) {
            return;
        }
        const hint: IHint = {
            type: IIssueType.Hint,
            id: this.dom(ele).attr('id'),
            quickfixes: [],
            file: '',
            severity: '',
            ruleId: '',
            effort: '',
            title: '',
            links: [],
            report: '',
            originalLineSource: '',
            quickfixedLines: {},
            lineNumber: 0,
            column: 0,
            length: 0,
            sourceSnippet: '',
            category: '',
            hint: '',
            configuration: this.config,
            dom: ele,
            complete: false
        };
        if (this.dom(ele).attr('complete')) {
            hint.complete = true;
        }

        await this.readHintChildElements(ele, hint);
        
        return hint;
    }

    private async readHintChildElements(ele: any, hint: IHint): Promise<void> {
        for (const child of ele.children) {
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
        }
    }

    private async computeQuickfixes(ele: CheerioElement, issue: IIssue): Promise<IQuickFix[]> {
        const quickfixes: IQuickFix[] = [];

        for (const child of ele.children) {
            switch (child.name) {
                case 'quickfix': {
                    const quickfix = await this.computeQuickfix(child, issue);
                    quickfixes.push(quickfix);
                    break;
                }
            }
        }

        return quickfixes;
    }

    private async computeQuickfix(ele: CheerioElement, issue: IIssue): Promise<IQuickFix> {
        const quickfix: IQuickFix = {
            file: issue.file,
            issue,
            id: this.dom(ele).attr('id'),
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

        // If quickfixes have already been read and persisted
        if (this.config.summary.quickfixes) {
            const originalLineSource = this.config.summary.quickfixes[issue.id].originalLineSource;
            const quickfixedLine = this.config.summary.quickfixes[issue.id].quickfixedLines[quickfix.id];
            issue.originalLineSource = issue.originalLineSource || originalLineSource;
            issue.quickfixedLines[quickfix.id] = quickfixedLine;
            return quickfix;
        }

        // Otherwise, read the quickfix data to be serialized later on
        if ((issue as any).lineNumber) {
            const hint = issue as IHint;
            const type = mime.lookup(hint.file);
            // TODO: This will ignore .properties files and others that we might want to support.
            if (type && type.startsWith('text')) {
                if (!hint.originalLineSource) {
                    hint.originalLineSource = await this.readLine(hint.file, hint.lineNumber);
                }
                if (quickfix.type === 'REPLACE') {
                    const quickfixedLine = this.replace(
                        hint.originalLineSource,
                        quickfix.searchString,
                        quickfix.replacementString);
                    hint.quickfixedLines[quickfix.id] = quickfixedLine;
                }
            }
            else {
                console.log(`unable to read mime type ${type} of file - ${hint.file}`);
            }
        }
        return quickfix;
    }

    private replace(origin, search, replacement): string {
        return origin.replace(search, replacement);
    }

    private async getClassifications(): Promise<IClassification[]> {
        const classifications: IClassification[] = [];
        const elements = this.dom('classifications').children();
        for (let index = 0; index < elements.length; index++) {
            const classification = await this.readClassification(elements[index]);
            classifications.push(classification);
        }
        return classifications;
    }

    private async readClassification(ele: any): Promise<IClassification> {
        if (this.dom(ele).attr('deleted')) {
            return;
        }
        const id = this.dom(ele).attr('id');
        const classification: IClassification = {
            type: IIssueType.Classification,
            id,
            quickfixes: [],
            quickfixedLines: {},
            originalLineSource: '',
            file: '',
            severity: '',
            ruleId: '',
            effort: '',
            title: id,
            links: [],
            report: '',
            description: '',
            category: '',
            configuration: this.config,
            dom: ele,
            complete: false
        };
        if (this.dom(ele).attr('complete')) {
            classification.complete = true;
        }

        await this.readClassificationChildElements(ele, classification);
        
        return classification;
    }

    private async readClassificationChildElements(ele: any, classification: IClassification): Promise<void> {
        for (const child of ele.children) {
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
                case 'rule-id': {
                    const node = child.children[0];
                    if (node) {
                        classification.ruleId = node.nodeValue;
                    }
                    break;
                }
            }
        }
    }

    async getClassificationsFor(file: string): Promise<IClassification[]> {
        const classifications = [];
        const allClassifications = await this.getClassifications();
        allClassifications.forEach(classification => {
            if (classification.file === file) {
                classifications.push(classification);
            }
        });
        return classifications;
    }

    async getHintsFor(file: string): Promise<IHint[]> {
        const hints = [];
        const allHints = await this.getHints();
        allHints.forEach(hint => {
            if (hint.file === file) {
                hints.push(hint);
            }
        });
        return hints;
    }

    deleteIssue(issue: IIssue): void {
        this.dom(issue.dom).attr('deleted', "true");
    }

    markIssueAsComplete(issue: IIssue): void {
        this.dom(issue.dom).attr('complete', "true");
    }

    private readLine(file: string, lineNumber: number): Promise<string> {
        return new Promise<string>(resolve => {
            const input = fs.createReadStream(file);
            var myInterface = readline.createInterface({ input });
            var lineno = 0;
            myInterface.on('line', function (line) {
                if (++lineno === lineNumber) {
                    myInterface.close();
                    input.destroy();
                    resolve(line)
                }
            });
        });
    }
}

export namespace AnalysisResults {
    
    export interface Model {
        hints: IHint[];
        classifications: IClassification[];
    }
}