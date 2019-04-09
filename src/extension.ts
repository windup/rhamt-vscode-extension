import * as vscode from 'vscode';
import { Utils } from './Utils';
import * as path from 'path';
import { RhamtView } from './explorer/rhamtView';
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
    modelService = new ModelService(new RhamtModel(), path.join(stateLocation, 'data'));
    rhamtView = new RhamtView(context, modelService);
    context.subscriptions.push(rhamtView);

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
            RhamtUtil.analyze(config, modelService);
        } catch (e) {
            console.log(e);
        }
    });
    context.subscriptions.push(runConfigurationDisposable);

    context.subscriptions.push(vscode.commands.registerCommand('rhamt.openReport', (report: any) => {
        open(report);
    }));
}
