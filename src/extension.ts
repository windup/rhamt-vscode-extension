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
import { RhamtModel, IssueContainer } from './model/model';
import { IssueDetailsView } from './issueDetails/issueDetailsView';
import { ReportView } from './report/reportView';
import { ConfigurationEditorServer } from './editor/configurationEditorServer';
import { ConfigurationServerController } from './editor/configurationServerController';
import { ClientConnectionService } from './editor/clientConnectionService';
import { ConfigurationEditorService } from './editor/configurationEditorService';
import { HintItem } from './tree/hintItem';
import { HintNode } from './tree/hintNode';
import { NewRulesetWizard } from './wizard/newRulesetWizard';
import * as endpoints from './server/endpoints';
import { ReportServer } from './report/reportServer';
import { ConfigurationEditorSerializer } from './editor/configurationEditorSerializer';
import { QuickfixContentProvider } from './quickfix/contentProvider';
import { QuickfixedResourceProvider } from './quickfix/quickfixedResourceProvider';

let detailsView: IssueDetailsView;
let modelService: ModelService;
let stateLocation: string;
let configEditorServer: ConfigurationEditorServer;
let reportServer: ReportServer;

export async function activate(context: vscode.ExtensionContext) {
    stateLocation = path.join(os.homedir(), '.rhamt', 'tooling');
    await Utils.loadPackageInfo(context);
    const out = path.join(stateLocation, 'data');
    const locations = await endpoints.getEndpoints(context, out);
    modelService = new ModelService(new RhamtModel(), out, locations);
    const configEditorService = new ConfigurationEditorService(locations, context);
    new RhamtView(context, modelService, configEditorService);
    new ReportView(context, locations);
    detailsView = new IssueDetailsView(context, locations);

    const configServerController = new ConfigurationServerController(modelService, locations);
    const connectionService = new ClientConnectionService(modelService);
    configEditorServer = new ConfigurationEditorServer(locations, configServerController, connectionService);
    configEditorServer.start();
    reportServer = new ReportServer(this.endpoints);
    reportServer.start();

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

export function deactivate() {
    configEditorServer.dispose();
    reportServer.dispose();
}
