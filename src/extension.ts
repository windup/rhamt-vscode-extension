'use strict';

import * as vscode from 'vscode';
import { Utils } from './Utils';
import { RhamtView } from './explorer/rhamtView';
import { RhamtModelService, RhamtModel } from 'raas-core';
import { RhamtController } from './rhamtController';

let rhamtView: RhamtView;
let modelService: RhamtModelService;

export async function activate(context: vscode.ExtensionContext) {

    await Utils.loadPackageInfo(context);

    modelService = new RhamtModelService(new RhamtModel(), '');

    rhamtView = new RhamtView(context, modelService);
    context.subscriptions.push(rhamtView);

    let analyzeWorkspaceDisposable = vscode.commands.registerCommand('rhamt.analyzeWorkspace', () => {
        const config = modelService.createConfiguration();
        const controller = new RhamtController(config);
        controller.analyze();
    });

    context.subscriptions.push(analyzeWorkspaceDisposable);
}
