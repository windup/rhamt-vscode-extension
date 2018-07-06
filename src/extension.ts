'use strict';

import * as vscode from 'vscode';
import { Server } from './server';

export function activate(context: vscode.ExtensionContext) {

    let startDisposable = vscode.commands.registerCommand('rhamt.startServer', () => {
        vscode.window.showInformationMessage('Starting RHAMT server...');
        Server.start();
    });

    context.subscriptions.push(startDisposable);

    let stopDisposable = vscode.commands.registerCommand('rhamt.stopServer', () => {
        vscode.window.showInformationMessage('Stopping RHAMT server ...');
        Server.stop();
    });

    context.subscriptions.push(stopDisposable);

    let analyzeDisposable = vscode.commands.registerCommand('rhamt.analyzeWorkspace', () => {
        vscode.window.showInformationMessage('RHAMT analyzing workspace ...');
        Server.analyzeWorkspace();
    });

    context.subscriptions.push(analyzeDisposable);
}

export function deactivate() {
    Server.stop();
}