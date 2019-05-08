import { WebviewPanel, window, ViewColumn } from 'vscode';
import { ReportEndpoints, IIssue } from '../model/model';
import { rhamtEvents } from '../events';

export class IssueDetailsView {

    onEditorClosed = new rhamtEvents.TypedEvent<void>();

    private view: WebviewPanel | undefined = undefined;
    private endpoints: ReportEndpoints;

    constructor(endpoints: ReportEndpoints) {
        this.endpoints = endpoints;
    }

    open(issue: IIssue): void {
        if (!this.view) {
            this.view = window.createWebviewPanel('rhamtIssueDetails', 'weblogic => eap7', ViewColumn.Five, {
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
        this.view.reveal(ViewColumn.Five);
    }

    private render(issue: IIssue): string {
        let html: string;
        if (issue) {
            html = `
                <!DOCTYPE html>
                <html>
                    <body style="margin:0px;padding:0px;overflow:hidden">
                    <p>File: ${issue.file}</p>
                    <p>Category: ${issue.category}</p>
                    <p>Effort ${issue.effort}</p>
                    <p>Links ${issue.links}</p>
                    <p>Report ${issue.report}</p>
                    <p>Rule ID: ${issue.ruleId}</p>
                    <p>Severity: ${issue.severity}</p>
                    </body>
                </html>
            `;
        }
        else {
            html = `
                <!DOCTYPE html>
                <html>
                    <body style="margin:0px;padding:0px;overflow:hidden">
                    <p>No details available.</p>
                    </body>
                </html>
            `;
        }
        return html;
    }
}