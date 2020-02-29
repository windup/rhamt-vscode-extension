/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { WebviewPanel, window, ViewColumn, ExtensionContext, commands } from 'vscode';
import { Endpoints, IIssue, IssueContainer } from '../model/model';
import { rhamtEvents } from '../events';
import * as path from 'path';

export class IssueDetailsView {

    onEditorClosed = new rhamtEvents.TypedEvent<void>();

    private view: WebviewPanel | undefined = undefined;
    private endpoints: Endpoints;
    private context: ExtensionContext;

    constructor(context: ExtensionContext, endpoints: Endpoints) {
        this.context = context;
        this.endpoints = endpoints;
        this.context.subscriptions.push(commands.registerCommand('rhamt.openIssueDetails', async item => {
            this.open((item as IssueContainer).getIssue(), true);
        }));
        this.context.subscriptions.push(commands.registerCommand('rhamt.openLink', item => {
            commands.executeCommand('rhamt.openReport', {
                getReport: () => {
                    return item;
                }
            });
        }));
    }

    async open(issue: IIssue, reveal?: boolean): Promise<void> {
        if (!reveal && !this.view) {
            return;
        }
        if (!this.view) {
            this.view = window.createWebviewPanel('rhamtIssueDetails', 'Issue Details', ViewColumn.One, {
                enableScripts: true,
                enableCommandUris: true,
                retainContextWhenHidden: true
            });
            this.view.onDidDispose(() => {
                this.view = undefined;
                this.onEditorClosed.emit(undefined);
            });
        }
        this.view.webview.html = await this.render(issue);

        if (reveal) {
            this.view.reveal(ViewColumn.One);
        }
    }

    private async render(issue: any): Promise<string> {
        const url = await this.endpoints.configurationLocation();
        const cssPath = `${url}dark/issue-details.css`;
        const config = issue.getConfiguration();
        const reports = path.join(config.options['output'], 'reports', path.sep);
        let report = '';
        if (issue.report && issue.report.startsWith(reports)) {
            report = issue.report.replace(reports, '');
            report = `<a class="report-link" href="command:rhamt.openLink?%22${issue.report}%22">Open Report</a>`;
        }
        const showdown = require('showdown');
        const converter = new showdown.Converter();
        const noDetails = '—';
        const isHint = 'hint' in issue;
        let body = '';
        body += '<h3>Title</h3>';
        body += issue.title ? issue.title : noDetails;
        if (report) {
            body += '<h3>Report</h3>';
            body += report;
        }
        body += `<h3>${isHint ? 'Message' : 'Description'}</h3>`;
        body += (isHint && issue.hint) ? converter.makeHtml(issue.hint) : (!isHint && issue.description) ? issue.description : noDetails;
        body += '<h3>Category ID</h3>';
        body += issue.category ? issue.category : noDetails;
        body += '<h3>Level of Effort</h3>';
        body += issue.effort ? issue.effort : noDetails;
        body += '<h3>Rule ID</h3>';
        body += issue.ruleId ? issue.ruleId : noDetails;
        body += '<h3>More Information</h3>';
        if (issue.links.length === 0) {
            body += noDetails;
        }
        issue.links.forEach(link => {
            body += `
                <p>${link.title}</p>
                <ul>
                    <li>
                        <a class="report-link" href="command:rhamt.openLink?%22${link.url}%22">${link.url}</a>
                    </li>
                </ul>
            `;
        });
        if (isHint) {
            body += '<h3>Source Snippet</h3>';
            body += issue.sourceSnippet ? issue.sourceSnippet : noDetails;
        }
        const dark = process.env.CHE_WORKSPACE_NAMESPACE ? 'dark' : '';
        let html: string;
        if (issue) {
            html = `
                <!DOCTYPE html>
                <html>
                    <head>
                        <meta http-equiv="Content-Type" content="text/html;charset=utf-8">
                        <link href="${cssPath}" rel="stylesheet" type="text/css">
                    </head>
                    <body>
                    <div style="margin:0px;padding:0px;" class="view ${dark}">
                        ${body}
                    </div>
                    </body>
                </html>
            `;
        }
        else {
            html = `<!DOCTYPE html>
                <html>
                    <head>
                        <meta charset="UTF-8">
                        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; https:;">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    </head>
                    <body style="margin:0px;padding:0px;overflow:hidden; margin-left: 20px;">
                        <p>No issue details available.</p>
                    </body>
                </html>
            `;
        }
        return html;
    }
}