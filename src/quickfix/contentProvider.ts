import * as vscode from "vscode";

export class QuickfixContentProvider implements vscode.TextDocumentContentProvider {
    
    provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): string {
        return '';
    }
}