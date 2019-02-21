'use strict';

import * as vscode from 'vscode';
import { Utils } from './Utils';
import { RhamtView } from './explorer/rhamtView';
import { OptionsBuilder } from './optionsBuilder';
import { ModelService } from './model/modelService';
import { RhamtModel } from './model/model';

let rhamtView: RhamtView;
let modelService: ModelService;

export async function activate(context: vscode.ExtensionContext) {

    await Utils.loadPackageInfo(context);

    modelService = new ModelService(new RhamtModel());

    rhamtView = new RhamtView(context, modelService);
    context.subscriptions.push(rhamtView);

    let analyzeWorkspaceDisposable = vscode.commands.registerCommand('rhamt.analyzeWorkspace', async () => {
        const config = modelService.createConfigurationWithName('rhamtConfiguration');
        try {
            await Utils.initConfiguration(config);
        } catch (e) {
            console.log(e);
            return;
        }

        const result = await OptionsBuilder.build(config);

        if (result) {

        }
    });

    context.subscriptions.push(analyzeWorkspaceDisposable);

    context.subscriptions.push(vscode.commands.registerCommand('rhamt.createConfiguration', () => {
        vscode.window.showInputBox({
            prompt: "Name",
            validateInput: (value: string) => {
                if (value.trim().length === 0) {
                    return 'Name is required';
                }
            }
        }).then(name => {
            if (name) {
                modelService.createConfigurationWithName(name);
            }
        });
    }));
    context.subscriptions.push(vscode.commands.registerCommand('rhamt.deleteConfiguration', item => {
        const config = item.config;
        modelService.deleteConfiguration(config);
    }));
}
