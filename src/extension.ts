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
import * as json from 'jsonc-parser';
import { RhamtUtil } from './server/rhamtUtil';
import * as fs from 'fs-extra';
import { IssueDetailsView } from './issueDetails/issueDetailsView';
import { ReportView } from './report/reportView';

let rhamtView: RhamtView;
let detailsView: IssueDetailsView;
let modelService: ModelService;
let stateLocation: string;

export async function activate(context: vscode.ExtensionContext) {
    stateLocation = context.storagePath;
    await Utils.loadPackageInfo(context);
    const out = path.join(stateLocation, 'data');
    const reportEndpoints = getReportEndpoints(context, out);
    modelService = new ModelService(new RhamtModel(), out, reportEndpoints);
    rhamtView = new RhamtView(context, modelService);
    new ReportView(context, reportEndpoints);
    context.subscriptions.push(rhamtView);
    detailsView = new IssueDetailsView(context, reportEndpoints);

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

function getNode(node: json.Node, text: string, config: RhamtConfiguration): json.Node {
    let found = false;
    let container = undefined;
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

function getReportEndpoints(ctx: vscode.ExtensionContext, out: string): any {
    const port = () => {
        return process.env.RAAS_PORT || String(61435);
    };
    const host = () => {
        return 'localhost';
    };
    const location = () => {
        return `http://${host()}:${port()}`;
    };
    return {
        port,
        host,
        location,
        resourcesRoot: () => {
            return vscode.Uri.file(path.join(ctx.extensionPath, 'resources'));
        },
        reportsRoot: () => {
            return out;
        }
    };
}
