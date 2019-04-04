import * as vscode from 'vscode';
import { Utils } from './Utils';
import * as path from 'path';
import { RhamtView } from './explorer/rhamtView';
import { OptionsBuilder } from './optionsBuilder';
import { ModelService } from './model/modelService';
import { RhamtModel } from './model/model';
import * as open from 'opn';
import { RhamtUtil } from './server/rhamtUtil';

let rhamtView: RhamtView;
let modelService: ModelService;
let stateLocation: string;

export async function activate(context: vscode.ExtensionContext) {
    stateLocation = context.extensionPath;
    await Utils.loadPackageInfo(context);

    modelService = new ModelService(new RhamtModel());
    modelService.load(path.join(stateLocation, 'data', 'model.json'));

    rhamtView = new RhamtView(context, modelService);
    context.subscriptions.push(rhamtView);

    const createConfigurationDisposable = vscode.commands.registerCommand('rhamt.createConfiguration', async () => {
        const config = await OptionsBuilder.build(modelService);
        if (config) {
            modelService.addConfiguration(config);
            vscode.window.showInformationMessage(`Successfully Created: ${config.name}`);
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

        const configs = modelService.model.getConfigurations().map(item => item.name);
        if (configs.length === 0) {
            vscode.window.showInformationMessage('No configurations available.');
            return;
        }

        const name = await vscode.window.showQuickPick(configs, {placeHolder: 'Choose the Configuration'});
        if (!name) {
            return;
        }
        const config = modelService.getConfigurationWithName(name);
        if (!config) {
            return;
        }
        try {
            RhamtUtil.analyze(config);
        } catch (e) {
            console.log(e);
            return;
        }
    });
    context.subscriptions.push(runConfigurationDisposable);

    context.subscriptions.push(vscode.commands.registerCommand('rhamt.deleteConfiguration', async () => {
        const configs = modelService.model.getConfigurations().map(item => item.name);
        if (configs.length === 0) {
            vscode.window.showInformationMessage('No configurations available.');
            return;
        }
        const selection = await vscode.window.showQuickPick(configs, {placeHolder: 'Choose the Configuration(s) to Delete', canPickMany: true});
        if (!selection) {
            return;
        }
        const deleted = [];
        selection.forEach(config => {
            if (modelService.deleteConfigurationWithName(config)) {
                deleted.push(config);
            }
        });
        if (deleted.length > 0) {
            vscode.window.showInformationMessage(`Successfully Deleted: ${deleted}`);
        }
    }));

    context.subscriptions.push(vscode.commands.registerCommand('rhamt.openReport', (report: any) => {
        open(report);
    }));
}

export function deactivate() {
    modelService.save(path.join(stateLocation, 'data', 'model.json'));
}
