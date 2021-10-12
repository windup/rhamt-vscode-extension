import * as vscode from 'vscode';
import { IHint } from '../model/model';
import { ModelService } from '../model/modelService';

export const MTA_HINT = 'mta_hint';

export const mtaDiagnostics = vscode.languages.createDiagnosticCollection("mta");

export function initMarkerSupport(context: vscode.ExtensionContext, modelService: ModelService): void {

	context.subscriptions.push(mtaDiagnostics);

    // TODO: Clear diagnostics for closed files so we don't keep re-creating them.

    if (vscode.window.activeTextEditor) {
        refreshHints(vscode.window.activeTextEditor.document, modelService);
    }
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor) {
                refreshHints(editor.document, modelService);
            }
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(e => refreshHints(e.document, modelService))
    );

    context.subscriptions.push(
        vscode.workspace.onDidCloseTextDocument(doc => mtaDiagnostics.delete(doc.uri))
    );

    context.subscriptions.push(
		vscode.workspace.onDidCloseTextDocument(doc => mtaDiagnostics.delete(doc.uri))
	);

    refreshOpenEditors(modelService);
}

export function refreshOpenEditors(modelService: ModelService): void {
    vscode.window.visibleTextEditors.forEach(editor => refreshHints(editor.document, modelService));
}

export function refreshHints(doc: vscode.TextDocument, modelService: ModelService): void {
	const diagnostics: vscode.Diagnostic[] = [];
    mtaDiagnostics.delete(doc.uri);
    modelService.getActiveHints().filter(issue => issue.file === doc.uri.fsPath).forEach(issue => {
        const diagnostic = createDiagnostic(doc, issue);
        if (diagnostic) {
            diagnostics.push(diagnostic);
        }
    });
    if (diagnostics.length > 0) {
        mtaDiagnostics.set(doc.uri, diagnostics);
    }
}

function createDiagnostic(doc: vscode.TextDocument, issue: IHint): vscode.Diagnostic | undefined {
    const lineNumber = issue.lineNumber-1;
    const lineOfText = doc.lineAt(lineNumber);
    if (lineOfText.isEmptyOrWhitespace || (issue.originalLineSource && lineOfText.text !== issue.originalLineSource)) {
        return undefined;
    }
	const diagnostic = new vscode.Diagnostic(
        new vscode.Range(lineNumber, issue.column, lineNumber, issue.length+issue.column),
        issue.title,
		convertSeverity(issue)
    );
	diagnostic.code = MTA_HINT;
	return diagnostic;
}

function convertSeverity(hint: IHint): vscode.DiagnosticSeverity {
    let severity: vscode.DiagnosticSeverity = vscode.DiagnosticSeverity.Information;
    if (hint.complete) {
        severity = vscode.DiagnosticSeverity.Hint;
    }
    else if (!hint.category || hint.category.includes('error') || hint.category.includes('mandatory')) {
        severity = vscode.DiagnosticSeverity.Error;
    }
    else if (hint.category.includes('potential')) {
        severity = vscode.DiagnosticSeverity.Warning;
    }
    return severity;
}
