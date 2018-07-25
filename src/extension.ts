'use strict';

import * as vscode from 'vscode';
import { Utils } from './Utils';
import { RhamtService } from './rhamtService';

export async function activate(context: vscode.ExtensionContext) {

    await Utils.loadPackageInfo(context);

    let rhamtService = new RhamtService();
        
    let startDisposable = vscode.commands.registerCommand('rhamt.startServer', async () => {
        rhamtService.startServer();
    });

    context.subscriptions.push(startDisposable);

    let stopDisposable = vscode.commands.registerCommand('rhamt.stopServer', () => {
        rhamtService.stopServer();
    });

    context.subscriptions.push(stopDisposable);

    const shutdown: vscode.Disposable = { dispose: () => {rhamtService.stopServer()}};
    context.subscriptions.push(shutdown);

    class BrowserContentProvider implements vscode.TextDocumentContentProvider {
        provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): string {
            // TODO: detect failure to load page (e.g. google.com) and display error to user.
            return `<iframe src="${uri}" frameBorder="0" style="width: 100%; height: 100%" />`;
        }
    }
    let provider = new BrowserContentProvider();

    let registrationHTTPS = vscode.workspace.registerTextDocumentContentProvider('https', provider);
    let registrationHTTP = vscode.workspace.registerTextDocumentContentProvider('http', provider);

    let analyzeWorkspaceDisposable = vscode.commands.registerCommand('rhamt.analyzeWorkspace', () => {
            /*if (await Utils.checkRhamtAvailablility()) {
                vscode.window.showInformationMessage('RHAMT analyzing workspace ...');
                rhamtService.analyzeWorkspace();
            }*/
            rhamtService.analyzeWorkspace();


            // commands.executeCommand('vscode.open', Uri.parse('https://go.microsoft.com/fwlink/?linkid=839919'));
            
            //let uri = vscode.Uri.parse('file:///Users/johnsteele/Desktop/devstudio/4_1_test/ws/demo/out/index.html');
            
            
            // let uri = vscode.Uri.parse('https://www.google.com');
            // vscode.commands.executeCommand('vscode.previewHtml', uri, vscode.ViewColumn.Two, 'CSS Property Preview').then((success) => {
            // }, (reason) => {
            //     vscode.window.showErrorMessage(reason);
            // });
        
            // let uri = vscode.Uri.parse('file:///Users/johnsteele/Desktop/devstudio/4_1_test/ws/demo/out/index.html');
        
            // return vscode.commands.executeCommand('vscode.previewHtml', uri, vscode.ViewColumn.Two).then((success) => {
            // }, (reason) => {
            //     vscode.window.showErrorMessage(reason);
            // }
            // );
    });



    // vscode.commands.executeCommand('vscode.previewHtml', '/Users/johnsteele/Desktop/devstudio/4_1_test/ws/demo/out/index.html', vscode.ViewColumn.Two, 'CSS Property Preview').then((success) => {
    // }, (reason) => {
    //     vscode.window.showErrorMessage(reason);
    // });

    context.subscriptions.push(analyzeWorkspaceDisposable);
}

export function deactivate() {
}