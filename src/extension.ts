'use strict';

import * as vscode from 'vscode';
import { Server } from './server';
import { Utils } from './Utils';

export async function activate(context: vscode.ExtensionContext) {

    await Utils.loadPackageInfo(context);

    let startDisposable = vscode.commands.registerCommand('rhamt.startServer', () => {
        (async () => {
            if (await Utils.checkRhamtAvailablility()) {
                vscode.window.showInformationMessage('Starting RHAMT server...');
                Server.start();
            }
        })();
    });

    context.subscriptions.push(startDisposable);

    let stopDisposable = vscode.commands.registerCommand('rhamt.stopServer', () => {
        vscode.window.showInformationMessage('Stopping RHAMT server ...');
        Server.stop();
    });

    context.subscriptions.push(stopDisposable);

    let analyzeWorkspaceDisposable = vscode.commands.registerCommand('rhamt.analyzeWorkspace', () => {
        (async () => {
            if (await Utils.checkRhamtAvailablility()) {
                vscode.window.showInformationMessage('RHAMT analyzing workspace ...');
                Server.analyzeWorkspace();
            }
        })();
    });

    context.subscriptions.push(analyzeWorkspaceDisposable);
}

export function deactivate() {
    Server.stop();
}