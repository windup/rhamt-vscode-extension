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

    const createConfigurationDisposable = vscode.commands.registerCommand('rhamt.createConfiguration', async () => {
        const config = await OptionsBuilder.build(modelService);
        if (config) {
            const run = await vscode.window.showQuickPick(['Yes', 'No'], {placeHolder: 'Run the analysis?'});
            if (!run || run === 'No') {
                return;
            }
            try {
                await Utils.initConfiguration(config);
            } catch (e) {
                console.log(e);
                return;
            }
        }
    });
    context.subscriptions.push(createConfigurationDisposable);

    const runConfigurationDisposable = vscode.commands.registerCommand('rhamt.runConfiguration', async () => {

        const configs = modelService.model.getConfigurations().map(item => item.options.get('name'));
        if (configs.length === 0) {
            vscode.window.showInformationMessage('No configurations available.');
            return;
        }

        const id = await vscode.window.showQuickPick(configs, {placeHolder: 'Choose the Configuration'});
        const config = modelService.getConfiguration(id);
        if (config) {
            try {
                await Utils.initConfiguration(config);
            } catch (e) {
                console.log(e);
                return;
            }
        }
    });
    context.subscriptions.push(runConfigurationDisposable);

    context.subscriptions.push(vscode.commands.registerCommand('rhamt.deleteConfiguration', async () => {
        const configs = modelService.model.getConfigurations().map(item => item.options.get('name'));
        if (configs.length === 0) {
            vscode.window.showInformationMessage('No configurations available.');
            return;
        }
        const selection = await vscode.window.showQuickPick(configs, {placeHolder: 'Choose the Configuration(s) to Delete', canPickMany: true});
        if (selection) {
            selection.forEach(config => {
                modelService.deleteConfigurationWithName(config);
            });
        }
    }));
}
