/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';
import { Utils } from './Utils';
import * as path from 'path';
import { RhamtView } from './explorer/rhamtView';
import { ModelService } from './model/modelService';
import { RhamtModel, RhamtConfiguration } from './model/model';
import { RhamtUtil } from './server/rhamtUtil';
import * as fs from 'fs-extra';
import { IssueDetailsView } from './issueDetails/issueDetailsView';
import { ReportView } from './report/reportView';
import { ConfigurationEditorServer } from './editor/configurationEditorServer';
import { ConfigurationServerController } from './editor/configurationServerController';
import { ClientConnectionService } from './editor/clientConnectionService';
import { ConfigurationEditorService } from './editor/configurationEditorService';

let detailsView: IssueDetailsView;
let modelService: ModelService;
let stateLocation: string;

export async function activate(context: vscode.ExtensionContext) {
    stateLocation = context.storagePath;
    await Utils.loadPackageInfo(context);
    const out = path.join(stateLocation, 'data');
    const endpoints = getEndpoints(context, out);
    modelService = new ModelService(new RhamtModel(), out, endpoints);
    new RhamtView(context, modelService);
    new ReportView(context, endpoints);
    detailsView = new IssueDetailsView(context, endpoints);

    const configServerController = new ConfigurationServerController(modelService, endpoints);
    const connectionService = new ClientConnectionService(modelService);
    const configEditorServer = new ConfigurationEditorServer(endpoints, configServerController, connectionService);
    configEditorServer.start();
    const configEditorService = new ConfigurationEditorService(endpoints, context);

    const runConfigurationDisposable = vscode.commands.registerCommand('rhamt.runConfiguration', async (item) => {
        const config = item.config;
        try {
            await RhamtUtil.analyze(config, modelService);
        } catch (e) {
            console.log(e);
        }
    });
    context.subscriptions.push(runConfigurationDisposable);

    context.subscriptions.push(vscode.commands.registerCommand('rhamt.openDoc', data => {
        detailsView.open(data.issue);
        vscode.workspace.openTextDocument(vscode.Uri.file(data.uri)).then(async doc => {
            const editor = await vscode.window.showTextDocument(doc);
            if (data.line) {
                editor.selection = new vscode.Selection(
                    new vscode.Position(data.line, data.column),
                    new vscode.Position(data.line, data.length)
                );
                editor.revealRange(new vscode.Range(data.line, 0, data.line + 1, 0), vscode.TextEditorRevealType.InCenter);
            }
        });
    }));

    context.subscriptions.push(vscode.commands.registerCommand('rhamt.openConfiguration', (config: RhamtConfiguration) => {
        const location = modelService.getModelPersistanceLocation();
        fs.exists(location, exists => {
            if (exists) {
                const configuration = modelService.getConfiguration(config.id);
                if (configuration) {
                    configEditorService.openConfiguration(configuration);
                }
                // vscode.workspace.openTextDocument(vscode.Uri.file(location)).then(async doc => {
                //     const editor = await vscode.window.showTextDocument(doc);
                //     const node = getNode(json.parseTree(doc.getText()), doc.getText(), config);
                //     if (node) {
                //         const range = new vscode.Range(doc.positionAt(node.offset), doc.positionAt(node.offset + node.length));
                //         editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
                //         editor.selection = new vscode.Selection(range.start, range.end);
                //     }
                // });
            }
            else {
                vscode.window.showErrorMessage('Unable to find configuration persistance file.');
            }
        });
    }));

    context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(doc => {
        if (doc.fileName === modelService.getModelPersistanceLocation()) {
            modelService.reload().then(() => {
                vscode.commands.executeCommand('rhamt.modelReload');
            }).catch(e => {
                vscode.window.showErrorMessage(`Error reloading configurations - ${e}`);
            });
        }
    }));
    Utils.checkCli(modelService.outDir, context);
}

// function getNode(node: json.Node, text: string, config: RhamtConfiguration): json.Node {
//     let found = false;
//     let container = undefined;
//     json.visit(text, {
//         onObjectProperty: (property: string, offset: number, length: number, startLine: number, startCharacter: number) => {
//             if (!found && property === 'name') {
//                 const childPath = json.getLocation(text, offset).path;
//                 const childNode = json.findNodeAtLocation(node, childPath);
//                 if (childNode && childNode.value === config.name) {
//                     found = true;
//                     container = childNode.parent.parent;
//                 }
//             }
//         }
//     });
//     return container;
// }

function getEndpoints(ctx: vscode.ExtensionContext, out: string): any {
    const host = () => {
        return 'localhost';
    };
    const configurationPort = () => {
        return process.env.RHAMT_CONFIG_PORT || String(61436);
    };
    const configurationLocation = () => {
        return `http://${host()}:${configurationPort()}`;
    };
    const reportPort = () => {
        return process.env.RHAMT_REPORT_PORT || String(61435);
    };
    const reportHost = () => {
        return 'localhost';
    };
    const reportLocation = () => {
        return `http://${host()}:${reportPort()}`;
    };
    return {
        reportPort,
        reportHost,
        reportLocation,
        resourcesRoot: () => {
            return vscode.Uri.file(path.join(ctx.extensionPath, 'resources')).fsPath;
        },
        configurationResourceRoot: () => {
            return vscode.Uri.file(path.join(ctx.extensionPath, 'resources', 'configuration-editor')).fsPath;
        },
        reportsRoot: () => {
            return out;
        },
        configurationPort,
        configurationLocation: (config: RhamtConfiguration): string => {
            return `${configurationLocation()}/${config.id}`;
        }
    };
}
