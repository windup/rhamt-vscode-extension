import * as vscode from 'vscode';
import { Utils } from './Utils';
import * as path from 'path';
import { RhamtView } from './explorer/rhamtView';
import { ModelService } from './model/modelService';
import { RhamtModel, RhamtConfiguration } from './model/model';
import * as json from 'jsonc-parser';
import { RhamtUtil } from './server/rhamtUtil';
import * as fs from 'fs-extra';

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

        const configs = modelService.model.configurations.map(item => item.name);
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

    context.subscriptions.push(vscode.commands.registerCommand('rhamt.openDoc', (uri: string) => {
        vscode.workspace.openTextDocument(vscode.Uri.file(uri)).then(doc => {
            vscode.window.showTextDocument(doc);
        });
    }));

    context.subscriptions.push(vscode.commands.registerCommand('rhamt.openConfiguration', (config: RhamtConfiguration) => {
        const location = modelService.getModelPersistanceLocation();
        fs.exists(location, exists => {
            if (exists) {
                vscode.workspace.openTextDocument(vscode.Uri.file(location)).then(async doc => {
                    const editor = await vscode.window.showTextDocument(doc);
                    const node = getNode(json.parseTree(doc.getText()), doc.getText(), config);
                    if (node) {
                        const range = new vscode.Range(doc.positionAt(node.offset), doc.positionAt(node.offset + node.length));
                        editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
                        editor.selection = new vscode.Selection(range.start, range.end);
                    }
                });
            }
            else {
                vscode.window.showErrorMessage('Unable to find configuration persistance file.');
            }
        });
    }));

    vscode.workspace.onDidSaveTextDocument(doc => {
        if (doc.fileName === modelService.getModelPersistanceLocation()) {
            modelService.reload().then(() => {
                vscode.commands.executeCommand('rhamt.refreshExplorer');
            }).catch(e => {
                vscode.window.showErrorMessage(`Error reloading configurations - ${e}`);
            });
        }
    });
}

function getNode(node: json.Node, text: string, config: RhamtConfiguration): json.Node {
    let found = false;
    let container: any = undefined;
    json.visit(text, {
        onObjectProperty: (property: string, offset: number, length: number, startLine: number, startCharacter: number) => {
            if (!found && property === 'name') {
                const childPath = json.getLocation(text, offset).path;
                const childNode = json.findNodeAtLocation(node, childPath);
                if (childNode && childNode.value === config.name) {
                    found = true;
                    container = childNode.parent.parent;
                }
            }
        }
    });
    return container;
}
