/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';
import { Utils } from './Utils';
import * as path from 'path';
import { RhamtView } from './explorer/rhamtView';
import { ModelService } from './model/modelService';
import { RhamtModel, IssueContainer, Endpoints } from './model/model';
import { IssueDetailsView } from './issueDetails/issueDetailsView';
import { ReportView } from './report/reportView';
import { ConfigurationEditorServer } from './editor/configurationEditorServer';
import { ConfigurationEditorService } from './editor/configurationEditorService';
import { HintItem } from './tree/hintItem';
import { HintNode } from './tree/hintNode';
import { NewRulesetWizard } from './wizard/newRulesetWizard';
import * as endpoints from './server/endpoints';
import { ReportServer } from './report/reportServer';
import { ConfigurationEditorSerializer } from './editor/configurationEditorSerializer';
import { QuickfixContentProvider } from './quickfix/contentProvider';
import { QuickfixedResourceProvider } from './quickfix/quickfixedResourceProvider';
import * as os from 'os';
import { initMarkerSupport } from './source/markers';

let detailsView: IssueDetailsView;
let modelService: ModelService;
let stateLocation: string;
let outputLocation: string;
let configEditorServer: ConfigurationEditorServer;
let reportServer: ReportServer;

export async function activate(context: vscode.ExtensionContext) {
    if (vscode.env.appName === "Eclipse Che") {
        stateLocation = path.join('/home', 'theia', 'mta', 'redhat.mta-vscode-extension');
        outputLocation = path.join(os.homedir(), 'output');
    }
    else {
        stateLocation = path.join(context.globalStoragePath, '.mta', 'tooling', 'vscode');
        outputLocation = stateLocation;
    }

    console.log(`mta state location is: ${stateLocation}`);
    
    await Utils.loadPackageInfo(context);
    const out = path.join(stateLocation);
    const locations = await endpoints.getEndpoints(context, out);
    modelService = new ModelService(new RhamtModel(), out, outputLocation, locations);
    const configEditorService = new ConfigurationEditorService(context, modelService);
    await modelService.readCliMeta();
    reportServer = await Private.createReportServer(locations);

    new RhamtView(context, modelService, configEditorService);
    new ReportView(context, locations);
    detailsView = new IssueDetailsView(context, locations, modelService);
    initMarkerSupport(context, modelService);
    
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
    // const download = (!Private.isChe() && !Private.isVSCode());
    Utils.checkCli(modelService.outDir, context, true);

    vscode.window.registerWebviewPanelSerializer('rhamtConfigurationEditor', new ConfigurationEditorSerializer(modelService, configEditorService));

    const quickfixContentProvider = new QuickfixContentProvider(modelService);
    context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider('quickfix', quickfixContentProvider));

    const quickfixedProvider = new QuickfixedResourceProvider(modelService);
    context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider('quickfixed', quickfixedProvider));
}

export function deactivate() {
    modelService.save();
    configEditorServer.dispose();
    reportServer.dispose();
}

namespace Private {
    export async function createReportServer(endpoints: Endpoints): Promise<ReportServer> {
        const reportServer = new ReportServer(endpoints);
        try {
            reportServer.start();    
        } catch (e) {
            console.log(`Error while starting report server: ${e}`);
        }
        return reportServer;
    }
    export function isChe(): boolean {
        return vscode.env.appName === "Eclipse Che";
    }
    export function isVSCode(): boolean {
        return vscode.env.appName === "Visual Studio Code";
    }
}
