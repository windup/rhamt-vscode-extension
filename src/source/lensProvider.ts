
import * as vscode from 'vscode';
import { ModelService } from '../model/modelService';

export class LensProvider implements vscode.CodeLensProvider {

    private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;
    private modelService: ModelService;

    constructor(private context: vscode.ExtensionContext, modelService: ModelService) {
        this.modelService = modelService;
        this.context.subscriptions.push(
            vscode.workspace.onDidChangeTextDocument(e => this.refresh()));
    }

    public refresh(): void {
        this._onDidChangeCodeLenses.fire();
    }

    public provideCodeLenses(doc: vscode.TextDocument, token: vscode.CancellationToken): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
        const codeLenses = [];
        this.modelService.getActiveHints().filter(issue => doc.uri.fsPath === issue.file).forEach(issue => {
            if (issue.complete) return;
            const lineNumber = issue.lineNumber-1;
            const lineOfText = doc.lineAt(lineNumber);
            if (lineOfText.isEmptyOrWhitespace || (issue.originalLineSource && lineOfText.text !== issue.originalLineSource)) {
                return undefined;
            }
            const range = new vscode.Range(lineNumber, issue.column, lineNumber, issue.length+issue.column);
            const lens = new vscode.CodeLens(range);
            lens.command = {
                command: 'rhamt.openIssueDetails',
                title: 'View Migration Details',
                arguments: [{ 
                    getIssue: () => {
                        return issue;
                    }
                }]
            }
            codeLenses.push(lens);
        });
        return codeLenses;
    }
}
