/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';
import * as os from 'os';
import { Utils } from './Utils';
import * as path from 'path';
import { RhamtView } from './explorer/rhamtView';
import { ModelService } from './model/modelService';
import { RhamtModel, RhamtConfiguration, IssueContainer } from './model/model';
import { IssueDetailsView } from './issueDetails/issueDetailsView';
import { ReportView } from './report/reportView';
import { ConfigurationEditorServer } from './editor/configurationEditorServer';
import { ConfigurationServerController } from './editor/configurationServerController';
import { ClientConnectionService } from './editor/clientConnectionService';
import { ConfigurationEditorService } from './editor/configurationEditorService';
import { HintItem } from './tree/hintItem';
import { HintNode } from './tree/hintNode';
import { NewRulesetWizard } from './wizard/newRulesetWizard';
import { ConfigurationEditorSerializer } from './editor/configurationEditorSerializer';
import { QuickfixContentProvider } from './quickfix/contentProvider';
import { QuickfixedResourceProvider } from './quickfix/quickfixedResourceProvider';

let detailsView: IssueDetailsView;
let modelService: ModelService;
let stateLocation: string;

export async function activate(context: vscode.ExtensionContext) {
    stateLocation = path.join(os.homedir(), '.rhamt', 'tooling');
    console.log(`rhamt-vscode-extension storing data at: ${stateLocation}`);
    await Utils.loadPackageInfo(context);
    const out = path.join(stateLocation, 'data');
    const endpoints = await getEndpoints(context, out);
    modelService = new ModelService(new RhamtModel(), out, endpoints);
    const configEditorService = new ConfigurationEditorService(endpoints, context);
    new RhamtView(context, modelService, configEditorService);
    new ReportView(context, endpoints);
    detailsView = new IssueDetailsView(context, endpoints);

    const configServerController = new ConfigurationServerController(modelService, endpoints);
    const connectionService = new ClientConnectionService(modelService);
    const configEditorServer = new ConfigurationEditorServer(endpoints, configServerController, connectionService);
    configEditorServer.start();

    context.subscriptions.push(vscode.commands.registerCommand('rhamt.openDoc', data => {
        const issue = (data as IssueContainer).getIssue();
        detailsView.open(issue);
        vscode.workspace.openTextDocument(vscode.Uri.file(issue.file)).then(async doc => {
            const editor = await vscode.window.showTextDocument(doc);
            let item: HintItem;
            if (data instanceof HintNode) {
                item = (data as HintNode).item;
            }
            else if (data instanceof HintItem) {
                item = data;
            }
            if (item) {
                editor.selection = new vscode.Selection(
                    new vscode.Position(item.getLineNumber(), item.getColumn()),
                    new vscode.Position(item.getLineNumber(), item.getLength())
                );
                editor.revealRange(new vscode.Range(item.getLineNumber(), 0, item.getLineNumber() + 1, 0), vscode.TextEditorRevealType.InCenter);
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

    const newRulesetDisposable = vscode.commands.registerCommand('rhamt.newRuleset', async () => {
        new NewRulesetWizard(modelService).open();
    }); 
    context.subscriptions.push(newRulesetDisposable);

    Utils.checkCli(modelService.outDir, context);

    vscode.window.registerWebviewPanelSerializer('rhamtConfigurationEditor', new ConfigurationEditorSerializer(modelService, configEditorService));

    const quickfixContentProvider = new QuickfixContentProvider(modelService);
    context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider('quickfix', quickfixContentProvider));

    const quickfixedProvider = new QuickfixedResourceProvider(modelService);
    context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider('quickfixed', quickfixedProvider));
}

async function getHost(port: string): Promise<string> {
    if (!process.env.CHE_WORKSPACE_NAMESPACE) {
        return `http://localhost:${port}/`;
    }
    const workspace = await require('@eclipse-che/plugin').workspace.getCurrentWorkspace();
    const runtimeMachines = workspace!.runtime!.machines || {};
    for (let machineName of Object.keys(runtimeMachines)) {
        const machineServers = runtimeMachines[machineName].servers || {};
        if (String(machineName).includes('rhamt')) {
            for (let serverName of Object.keys(machineServers)) {
                const url = machineServers[serverName].url!;
                const portNumber = machineServers[serverName].attributes.port!;
                if (String(portNumber) === port) {
                    return url;
                }
            }
        }
    }
    return undefined;
}

async function getEndpoints(ctx: vscode.ExtensionContext, out: string): Promise<any> {
    const configurationPort = () => {
        return process.env.RHAMT_CONFIGURATION_PORT || String(61436);
    };
    const findConfigurationLocation = async () => {
        return await getHost(configurationPort());
    };
    const reportPort = () => {
        return process.env.RHAMT_REPORT_PORT || String(61435);
    };
    const reportLocation = async () => {
        let location = await getHost(reportPort());
        if (!location) {
            console.error(`unable to find report location.`);
        }
        else if (!location.endsWith('/')) {
            location = `${location}/`;
        }
        return location;
    };
    return {
        reportPort,
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
        configurationLocation: async (config?: RhamtConfiguration): Promise<string> => {
            let location = await findConfigurationLocation();
            if (!location) {
                console.error(`unable to find configuration location.`);
            }
            if (config) {
                if (!location.endsWith('/')) {
                    location = `${location}/`;
                }
                location = `${location}${config.id}`;
            }
            return location;
        }
    };
}
