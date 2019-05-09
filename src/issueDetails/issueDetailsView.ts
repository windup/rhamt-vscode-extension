import { WebviewPanel, window, ViewColumn, ExtensionContext, Uri, commands } from 'vscode';
import { ReportEndpoints, IIssue, IssueContainer } from '../model/model';
import { rhamtEvents } from '../events';
import * as path from 'path';

export class IssueDetailsView {

    onEditorClosed = new rhamtEvents.TypedEvent<void>();

    private view: WebviewPanel | undefined = undefined;
    private endpoints: ReportEndpoints;
    private context: ExtensionContext;

    constructor(context: ExtensionContext, endpoints: ReportEndpoints) {
        this.context = context;
        this.endpoints = endpoints;
        this.context.subscriptions.push(commands.registerCommand('rhamt.openIssueDetails', item => {
            this.open((item as IssueContainer).getIssue(), true);
        }));
    }

    open(issue: IIssue, reveal?: boolean): void {
        if (!reveal && !this.view) {
            return;
        }
        if (!this.view) {
            this.view = window.createWebviewPanel('rhamtIssueDetails', 'Issue Details', ViewColumn.Two, {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [this.endpoints.resourcesRoot()]
            });
            this.view.onDidDispose(() => {
                this.view = undefined;
                this.onEditorClosed.emit(undefined);
            });
        }
        this.view.webview.html = this.render(issue);

        if (reveal) {
            this.view.reveal(ViewColumn.Two);
        }
    }

    private render(issue: IIssue): string {
        const cssPath = Uri.file(path.join(this.context.extensionPath, 'resources', 'dark', 'issue-details.css'));
        const config = issue.getConfiguration();
        const reports = path.join(config.options['output'], 'reports', path.sep);
        let report = '';
        if (issue.report && issue.report.startsWith(reports)) {
            report = issue.report.replace(reports, '');
            report = `<a class="report-link" href="#">${report}</a>`;
        }
        let html: string;
        if (issue) {
            html = `
                <!DOCTYPE html>
                <html>
                    <head>
                        <meta http-equiv="Content-Type" content="text/html;charset=utf-8">
                        <link href="${cssPath.with({ scheme: 'vscode-resource' })}" rel="stylesheet" type="text/css">
                    </head>
                    <body">
                    <div style="margin:0px;padding:0px;" class="view">
                        <table>
                                <tbody>
                                <tr style="background-color: inherit;">
                                    <th style="width: 10%"></th>
                                    <th style="width: 90%"></th>
                                </tr>
                                <tr>
                                    <td>
                                        <span class="issue-label">File</span>
                                    </td>
                                    <td>${issue.file}</td>
                                </tr>
                                <tr>
                                    <td>
                                        <span class="issue-label">Category</span>
                                    </td>
                                    <td>${issue.category ? issue.category : '—'}</td>
                                </tr>
                                <tr>
                                    <td>
                                        <span class="issue-label">Effort</span>
                                    </td>
                                    <td>${issue.effort ? issue.effort : '—'}</td>
                                </tr>
                                <tr>
                                    <td>
                                        <span class="issue-label">Links</span>
                                    </td>
                                    <td>${issue.links.length > 0 ? issue.links : '—'}</td>
                                </tr>
                                <tr>
                                    <td>
                                        <span class="issue-label">Report</span>
                                    </td>
                                    <td>${report ? report : '—'}</td>
                                </tr>
                                <tr>
                                    <td>
                                        <span class="issue-label">Rule ID</span>
                                    </td>
                                    <td>${issue.ruleId}</td>
                                </tr>
                                <tr>
                                    <td>
                                        <span class="issue-label">Severity</span>
                                    </td>
                                    <td>${issue.severity ? issue.severity : '—'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    </body>
                </html>
            `;
        }
        else {
            html = `
                <!DOCTYPE html>
                <html>
                    <body style="margin:0px;padding:0px;overflow:hidden; margin-left: 20px;">
                    <p>No issue details available.</p>
                    </body>
                </html>
            `;
        }
        return html;
    }
}