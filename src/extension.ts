'use strict';

import * as vscode from 'vscode';
import { Utils } from './Utils';
import { RhamtView } from './explorer/rhamtView';
import { OptionsBuilder } from './optionsBuilder';
import { ModelService } from './model/modelService';
import { RhamtModel, RhamtConfiguration } from './model/model';

let rhamtView: RhamtView;
let modelService: ModelService;

export async function activate(context: vscode.ExtensionContext) {

    await Utils.loadPackageInfo(context);

    modelService = new ModelService(new RhamtModel());

    rhamtView = new RhamtView(context, modelService);
    context.subscriptions.push(rhamtView);

    let analyzeWorkspaceDisposable = vscode.commands.registerCommand('rhamt.createConfiguration', async () => {
        const config = new RhamtConfiguration();

        const result = await OptionsBuilder.build(config);

        if (result) {
            // prompt save or save and run
            const run = false;
            
            if (run) {
                try {
                    await Utils.initConfiguration(config);
                } catch (e) {
                    console.log(e);
                    return;
                }
            }
        }
    });

    context.subscriptions.push(analyzeWorkspaceDisposable);

    context.subscriptions.push(vscode.commands.registerCommand('rhamt.deleteConfiguration', item => {
        const config = item.config;
        modelService.deleteConfiguration(config);
    }));
}
