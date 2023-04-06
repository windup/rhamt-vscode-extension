/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { WebviewPanel, window, ViewColumn, ExtensionContext, commands, Uri, workspace} from 'vscode';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as cheerio from 'cheerio';
import { getStateLocation } from '../extension';
import * as open from 'opn';

export class ReportView {

    private view: WebviewPanel | undefined = undefined;
    private context: ExtensionContext;

    constructor(context: ExtensionContext) {
        this.context = context;
        this.context.subscriptions.push(commands.registerCommand('rhamt.openReportExternal', async item => {
            this.openReport(item);
        }));
    }

    private async openReport(item: any): Promise<any> {
        let location = item.getReport() as string;
        if (!location) {
            return window.showErrorMessage(`Unable to find report on filesystem`);
        }
        console.log(`report: ${location}`);

        await this.open(location);
    }

    async open(location: string): Promise<void> {
        console.log(`Opening Report: ${location}`);

        open(location);
        return;
        
        if (this.view) {
            this.view.dispose();
        }
        // if (!this.view) {
            /* if (fs.existsSync(path.join(location, '..', '..', 'reports'))) {
                if (location.includes('index.html')) {
                    try {
                        await this.open(path.join(location, '..', '..', 'index.html'));
                        // await this.open(location);
                    }
                    catch(e) {
                        console.log(e);
                    }
                    return;
                }
            } */
            const resourceRoot = location.includes('index.html') ? path.join(location, '..') : path.join(location, '..', '..');
            const reportRoot = location.includes('index.html') ? path.join(location) : path.join(location, '..');

            console.log(`report root: ${reportRoot}`);
            

            this.view = window.createWebviewPanel('rhamtReportView', 'Report', ViewColumn.One, {
                enableScripts: true,
                enableCommandUris: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    Uri.file(path.join(this.context.extensionPath)),
                    Uri.file(resourceRoot)
                ]
            });
            // @ts-ignore
            this.view.reportsRoot = path.join(path.dirname(reportRoot), 'reports');
            /* this.view.onDidDispose(() => {
                this.view = undefined;
            }); */
        
            const issuesUri = vscode.Uri.file(path.join(path.dirname(reportRoot), 'reports', 'resources', 'js', 'windup-migration-issues.js'));
            const data = fs.readFileSync(issuesUri.fsPath, 'utf8');
            const dataUri = this.view.webview.asWebviewUri(vscode.Uri.parse(path.join(resourceRoot, 'reports/data/problem_summary_'))).toString();
            const result = data.replace(
                /script.src = "data\/problem_summary_"/g,
                `script.src = "${dataUri}"`);
            fs.writeFileSync(issuesUri.fsPath, result);
            
        // }
        const resource = Uri.file(location);

        const document = await workspace.openTextDocument(resource);      
        const content: string = this.provideDocumentContent(document);
       
        const fixedContent = this.fixLinks(content, location, resource);
        this.view.webview.html = fixedContent;

        this.view.webview.onDidReceiveMessage(async message => {
            console.log('server receieved message');
            console.log(message); 
            switch (message.command) {
                case 'openLink': {
                    try {
                        await this.openLink(message.link);
                    } catch (e) {
                        console.log(e);
                    }
                    return;
                }
                case 'openReport': {
                    try {
                        await this.openEmbeddedReport(message.link);
                    } catch (e) {
                        console.log(e);
                    }
                    return;
                }
            }
        });
        this.view.reveal(ViewColumn.One);
    }

    provideDocumentContent(htmlDocument: vscode.TextDocument) : string {
        const base = getStateLocation();
        const reportRootPath = htmlDocument.uri.fsPath.replace(base, '');
        const reportsNavUri = this.view.webview.asWebviewUri(vscode.Uri.parse(path.join(base, path.dirname(reportRootPath), 'reports/resources/js/navbar.js'))).toString();
        const resourcesNavUri = this.view.webview.asWebviewUri(vscode.Uri.parse(path.join(base, path.dirname(reportRootPath), 'resources/js/navbar.js'))).toString();
        const parsedDoc = htmlDocument.getText().split(/\r?\n/).map((l,i) => {
            if (l.includes('reports/resources/js/navbar.js')) {
                return l.replace('reports/resources/js/navbar.js', () => reportsNavUri.toString());
            }
            else {
                return l.replace('resources/js/navbar.js', () => resourcesNavUri.toString());
            }
        }).join("\n");
        const $ = cheerio.load(parsedDoc);
        const jsUri = this.view.webview.asWebviewUri(vscode.Uri.parse(path.join(this.context.extensionPath, 'resources', 'pre', 'dist', 'pre.js')));
        $("head").append(`
            <meta http-equiv="Content-Security-Policy" content="">
            <script src="${jsUri}"></script>
        `);
        return $.html();
    }

    private async openEmbeddedReport(link: string) {
        console.log(`openLink: ${link}`);

        // @ts-ignore
        const resource = Uri.parse(path.join(this.view.reportsRoot, link), false);

        // const resource = Uri.parse(link, false);
        try {
            const document = await workspace.openTextDocument(Uri.file(resource.fsPath));
            const content: string = this.provideDocumentContent(document);
            const fixedContent = this.fixLinks(content, resource.fsPath, resource);
            this.view.webview.html = fixedContent;
            this.view.reveal(ViewColumn.One);
        }
        catch (e) {
            console.log('Error opening link');
            console.log(e);
        }
    }

    private async openLink(link: string) {

        console.log(`openLink: ${link}`);

        const resource = Uri.parse(link, false);
        try {
            const document = await workspace.openTextDocument(Uri.file(resource.fsPath));
            const content: string = this.provideDocumentContent(document);
            const fixedContent = this.fixLinks(content, resource.fsPath, resource);
            this.view.webview.html = fixedContent;
            this.view.reveal(ViewColumn.One);
        }
        catch (e) {
            console.log('Error opening link');
            console.log(e);
        }
    }

    private fixLinks(html: string, location: string, resource: Uri) {
        const view = this.view;
        return html.replace(new RegExp("((?:src|href)=[\'\"])((?!http|\\/).*?)([\'\"])", "gmi"), function (subString, p1, p2, p3) {
            if (p2.endsWith('pre.js')) {
                return [p1, p2, p3].join("");
            }
            return [p1, view.webview.asWebviewUri(Uri.parse(path.join(path.dirname(resource.fsPath), p2))), p3].join("");
        });
    }
}