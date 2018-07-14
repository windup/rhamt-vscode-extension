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

    let analyzeWorkspaceDisposable = vscode.commands.registerCommand('rhamt.analyzeWorkspace', () => {
        (async () => {
            if (await Utils.checkRhamtAvailablility()) {
                vscode.window.showInformationMessage('RHAMT analyzing workspace ...');
                rhamtService.analyzeWorkspace();
            }
        })();
    });

    context.subscriptions.push(analyzeWorkspaceDisposable);
}

export function deactivate() {
}