'use strict';

import * as vscode from 'vscode';
import { Utils } from './Utils';
import { RhamtService } from './rhamtService';
import { RhamtView } from './explorer/rhamtView';
import { RhamtModelService, RhamtModel } from 'raas-core';
import * as path from 'path';

let rhamtView: RhamtView;
let modelService: RhamtModelService;

export async function activate(context: vscode.ExtensionContext) {

    await Utils.loadPackageInfo(context);

    modelService = new RhamtModelService(new RhamtModel(), path.join(__dirname, '..', 'data'));
    modelService.createConfiguration();

    rhamtView = new RhamtView(context, modelService);
    context.subscriptions.push(rhamtView);

    context.subscriptions.push(vscode.commands.registerCommand('rhamt.showRhamtExplorer', () => {
    }));

    let rhamtService = new RhamtService();
        
    let startDisposable = vscode.commands.registerCommand('rhamt.startServer', async config => {
        rhamtService.startServer(config);
    });

    context.subscriptions.push(startDisposable);

    let stopDisposable = vscode.commands.registerCommand('rhamt.stopServer', () => {
        rhamtService.stopServer();
    });

    context.subscriptions.push(stopDisposable);

    const shutdown: vscode.Disposable = { dispose: () => rhamtService.stopServer()};
    context.subscriptions.push(shutdown);

    let analyzeWorkspaceDisposable = vscode.commands.registerCommand('rhamt.analyzeWorkspace', config => {
        rhamtService.analyzeWorkspace(config);
    });

    context.subscriptions.push(analyzeWorkspaceDisposable);
}

export function deactivate() {
    rhamtView.dispose();
    modelService.save(path.join(__dirname, '..', 'data'));
}