/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';
import { Utils } from './Utils';
import * as path from 'path';
import { RhamtView } from './explorer/rhamtView';
import { ModelService } from './model/modelService';
import { RhamtModel, IssueContainer } from './model/model';
import { IssueDetailsView } from './issueDetails/issueDetailsView';
import { ReportView } from './report/reportView';
import { ConfigurationEditorServer } from './editor/configurationEditorServer';
import { ConfigurationEditorService } from './editor/configurationEditorService';
import { HintItem } from './tree/hintItem';
import { HintNode } from './tree/hintNode';
import { NewRulesetWizard } from './wizard/newRulesetWizard';
import * as endpoints from './server/endpoints';
import { ConfigurationEditorSerializer } from './editor/configurationEditorSerializer';
import { QuickfixContentProvider } from './quickfix/contentProvider';
import { QuickfixedResourceProvider } from './quickfix/quickfixedResourceProvider';
import * as os from 'os';
import { MarkerService } from './source/markers';
import { initQuickfixSupport } from './source/quickfix';
import { FileItem } from './tree/fileItem';
import * as git from './source/git';

let detailsView: IssueDetailsView;
let modelService: ModelService;
let stateLocation: string;
let outputLocation: string;
let configEditorServer: ConfigurationEditorServer;

let extensionPath = "";

export function getExtensionPath(): string {
	return extensionPath;
}

export function getStateLocation(): string {
    return stateLocation;
}

export async function activate(context: vscode.ExtensionContext) {

    extensionPath = context.extensionPath;
    
    await Utils.loadPackageInfo(context);
    stateLocation = outputLocation = path.join(os.homedir(), '.windup', 'tooling', 'vscode');

    console.log(`windup state location is: ${stateLocation}`);
    
    const out = path.join(stateLocation);
    const locations = await endpoints.getEndpoints(context, out);
    modelService = new ModelService(new RhamtModel(), out, outputLocation, locations);
    const configEditorService = new ConfigurationEditorService(context, modelService);
    await modelService.readCliMeta();

    const markerService = new MarkerService(context, modelService);
    new RhamtView(context, modelService, configEditorService, markerService);
    new ReportView(context);
    detailsView = new IssueDetailsView(context, locations, modelService);

    // const statusBar = new StatusBar();
    // const decorationsProvider = new DecorationsProvider(modelService, statusBar);
    // const toggleMtaHintsCommand = vscode.commands.registerCommand(
    //     StatusBar.toggleMtaHintsCommand,
    //   () => decorationsProvider.toggleHints()
    // );
    // context.subscriptions.push(vscode.Disposable.from(toggleMtaHintsCommand));

    initQuickfixSupport(context, modelService);
    
    context.subscriptions.push(vscode.commands.registerCommand('rhamt.openDoc', async (data) => {
        if (data instanceof FileItem) {
            openFile(vscode.Uri.file(data.file));
            return;
        }
        const issue = (data as IssueContainer).getIssue();
        detailsView.open(issue);
        let item: HintItem;
        if (data instanceof HintNode) {
            item = (data as HintNode).item;
        }
        else if (data instanceof HintItem) {
            item = data;
        }
        const uri = vscode.Uri.file(issue.file);
        await openFile(uri);
        if (item) {
            vscode.window.visibleTextEditors.filter(editor => editor.document.uri.fsPath === uri.fsPath).forEach(editor => {
                editor.selection = new vscode.Selection(
                    new vscode.Position(item.getLineNumber(), item.getColumn()),
                    new vscode.Position(item.getLineNumber(), item.getLength())
                );
                editor.revealRange(new vscode.Range(item.getLineNumber(), 0, item.getLineNumber() + 1, 0), vscode.TextEditorRevealType.InCenter);
            });
        }
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

    console.log('App Name:');
    console.log(vscode.env.appName);
    
    Utils.checkCli(modelService.outDir, context, Windup.isRemote());

    vscode.window.registerWebviewPanelSerializer('rhamtConfigurationEditor', new ConfigurationEditorSerializer(modelService, configEditorService));

    const quickfixContentProvider = new QuickfixContentProvider(modelService);
    context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider('quickfix', quickfixContentProvider));

    const quickfixedProvider = new QuickfixedResourceProvider(modelService);
    context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider('quickfixed', quickfixedProvider));

    // vscode.languages.registerCodeLensProvider("*", lensProvider);
    // const hintDecorationProvider = new HintDecorationProvider(modelService);
    // vscode.window.registerFileDecorationProvider()

    git.init(context);
}

export async function openFile(uri: vscode.Uri): Promise<void> {
    let activeEditor = vscode.window.visibleTextEditors.find(editor => editor.document.uri.fsPath === uri.fsPath);
    if (!activeEditor) {
        try {
            await vscode.commands.executeCommand('vscode.open', uri);
        } catch (e) {
            console.log(`Error while opening file: ${e}`);
            vscode.window.showErrorMessage(e);
            return;
        }
    } 
    else {
        await vscode.window.showTextDocument(activeEditor.document, {viewColumn: activeEditor.viewColumn});
    }
}

export function deactivate() {
    modelService.save();
    configEditorServer.dispose();
}

export namespace Windup {
    export function isLocal() {
        return vscode.env.appName === "Visual Studio Code" ||
            vscode.env.appName === 'VSCodium';
    }
    export function isRemote(): boolean {
        return vscode.env.appName === "CheCode" || 
            vscode.env.appName  === 'Gitpod Code';
    }
    export function isVSCode(): boolean {
        return vscode.env.appName === "Visual Studio Code";
    }
}
