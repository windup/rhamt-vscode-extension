/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';
import { window, ThemeColor } from 'vscode';
import { IHint } from '../model/model';
import { ModelService } from '../model/modelService';

export const MTA_HINT = 'MTA';

export class MarkerService {

    private mtaDiagnostics = vscode.languages.createDiagnosticCollection("mta");
    private unfixedHintDecorationType = window.createTextEditorDecorationType({
        backgroundColor: new ThemeColor('editor.stackFrameHighlightBackground')
    });

    constructor(
        private context: vscode.ExtensionContext, 
        private modelService: ModelService) {
            this.initMarkerSupport();
    }

    private initMarkerSupport(): void {
        const context = this.context;
        context.subscriptions.push(this.mtaDiagnostics);
        context.subscriptions.push(
            vscode.window.onDidChangeActiveTextEditor(editor => {
                this.refreshHints(editor.document, editor);
            })
        );
        context.subscriptions.push(
            vscode.workspace.onDidChangeTextDocument(e => this.refreshHints(e.document)));
        context.subscriptions.push(
            vscode.workspace.onDidOpenTextDocument(doc => this.refreshHints(doc)));
        context.subscriptions.push(
            vscode.workspace.onDidCloseTextDocument(doc => {
                this.mtaDiagnostics.delete(doc.uri);
            }
        ));
        this.refreshOpenEditors();
    }

    // public deactivate(): void {
    //     this.unfixedHintDecorationType.dispose();
    // }

    // private refreshEditor(doc: vscode.TextDocument): void {
    //     vscode.window.visibleTextEditors.filter(editor => editor.document.uri.fsPath === doc.uri.fsPath).forEach(editor => {
    //         this.refreshHints(editor.document,);
    //     }); 
    // }

    public refreshOpenEditors(file?: string): void {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            this.refreshHints(activeEditor.document, activeEditor);
        }
        if (!file) {
            vscode.window.visibleTextEditors.forEach(editor => {
                if (editor != activeEditor) {
                    this.refreshHints(editor.document, editor);
                }
            });
        }
        else {
            vscode.window.visibleTextEditors.filter(editor => editor.document.uri.fsPath === file).forEach(editor => {
                if (editor != activeEditor) {
                    this.refreshHints(editor.document, editor);
                }
            }); 
        }
    }

    private refreshHints(doc: vscode.TextDocument, editor?: vscode.TextEditor): void {
        const diagnostics: vscode.Diagnostic[] = [];
        const decorations = [new vscode.Range(0, 0, 0, 0)];
        this.mtaDiagnostics.delete(doc.uri);
        this.modelService.getActiveHints().filter(issue => doc.uri.fsPath === issue.file).forEach(issue => {
            const diagnostic = this.createDiagnostic(doc, issue);
            if (diagnostic) {
                diagnostics.push(diagnostic);
                const lineNumber = issue.lineNumber-1;
                const range = new vscode.Range(lineNumber, issue.column, lineNumber, issue.length+issue.column);
                decorations.push(range);
            }
        });
        if (diagnostics.length > 0) {
            this.mtaDiagnostics.set(doc.uri, diagnostics);
        }
        if (editor) {
            editor.setDecorations(this.unfixedHintDecorationType, decorations);
        }
    }

    private createDiagnostic(doc: vscode.TextDocument, issue: IHint): vscode.Diagnostic | undefined {
        if (issue.complete) return undefined;
        const lineNumber = issue.lineNumber-1;
        const lineOfText = doc.lineAt(lineNumber);
        if (lineOfText.isEmptyOrWhitespace || (issue.originalLineSource && lineOfText.text !== issue.originalLineSource)) {
            return undefined;
        }
        const diagnostic = new vscode.Diagnostic(
            new vscode.Range(lineNumber, issue.column, lineNumber, issue.length+issue.column),
            issue.title,
            this.convertSeverity(issue)
        );
        diagnostic.code = `${MTA_HINT} :: ${issue.configuration.id} :: ${issue.id}`;
        return diagnostic;
    }

    private convertSeverity(hint: IHint): vscode.DiagnosticSeverity {
        let severity: vscode.DiagnosticSeverity = vscode.DiagnosticSeverity.Information;
        if (!hint.category || hint.category.includes('error') || hint.category.includes('mandatory')) {
            severity = vscode.DiagnosticSeverity.Error;
        }
        else if (hint.category.includes('potential')) {
            severity = vscode.DiagnosticSeverity.Warning;
        }
        // else if (hint.complete) {
        //     severity = vscode.DiagnosticSeverity.Hint;
        // }
        return severity;
    }
}
