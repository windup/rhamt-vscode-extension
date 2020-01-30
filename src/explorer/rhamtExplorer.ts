/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';
import { DataProvider } from '../tree/dataProvider';
import { ModelService } from '../model/modelService';
import { OptionsBuilder } from '../optionsBuilder';
import { RhamtUtil } from '../server/rhamtUtil';
import { Grouping } from '../tree/configurationNode';
import { ConfigurationEditorService } from '../editor/configurationEditorService';
import { Diff } from '../diff/diff';

export class RhamtExplorer {

    private dataProvider: DataProvider;
    private grouping: Grouping = {
        groupByFile: true,
        groupBySeverity: false
    };

    constructor(private context: vscode.ExtensionContext,
        private modelService: ModelService,
        private configEditorService: ConfigurationEditorService) {
        this.dataProvider = this.createDataProvider();
        this.createViewer();
        this.createCommands();
    }

    private createCommands(): void {
        this.context.subscriptions.push(vscode.commands.registerCommand('rhamt.createConfiguration', async () => {
            const config = await OptionsBuilder.build(this.modelService);
            if (config) {
                this.modelService.addConfiguration(config);
                try {
                    await this.modelService.save();
                }
                catch (e) {
                    console.log(`Error saving configuration: ${e}`);
                    vscode.window.showErrorMessage(e);
                    return;
                }
                this.dataProvider.refresh();
                vscode.window.showInformationMessage(`Successfully Created: ${config.name}`);
                const run = await vscode.window.showQuickPick(['Yes', 'No'], {placeHolder: 'Run the analysis?'});
                if (!run || run === 'No') {
                    return;
                }
                try {
                    await RhamtUtil.analyze(config, this.modelService);
                } catch (e) {
                    console.log(e);
                    vscode.window.showErrorMessage(`Error during analysis: ${e}`);
                }
            }
        }));
        this.context.subscriptions.push(vscode.commands.registerCommand('rhamt.deleteConfiguration', async item => {
            const config = item.config;
            try {
                const deleted = await this.modelService.deleteConfiguration(config);
                if (deleted) {
                    this.configEditorService.closeEditor(config);
                }
                this.dataProvider.refresh();
            }
            catch (e) {
                console.log(`Error deleting configuration: ${e}`);
                vscode.window.showErrorMessage(`Error deleting configuration.`);
            }
        }));
        this.dataProvider.context.subscriptions.push(vscode.commands.registerCommand('rhamt.deleteIssue', async item => {
            try {
                item.root.deleteIssue(item);
                await this.modelService.saveAnalysisResults(item.root.config);
            }
            catch (e) {
                console.log(`Error saving analysis results: ${e}`);
                vscode.window.showErrorMessage(e);
            }
        }));
        this.dataProvider.context.subscriptions.push(vscode.commands.registerCommand('rhamt.markIssueAsComplete', item => {
            item.root.markIssueAsComplete(item);
            this.modelService.saveAnalysisResults(item.root.config).catch(e => {
                console.log(`Error saving analysis results: ${e}`);
                vscode.window.showErrorMessage(e);
            });
        }));
        this.dataProvider.context.subscriptions.push(vscode.commands.registerCommand('rhamt.deleteResults', item => {
            const output = item.config.options['output'];
            if (output) {
                this.modelService.deleteOuputLocation(output);
            }
            item.config.results = undefined;
        }));
        this.context.subscriptions.push(vscode.commands.registerCommand('rhamt.newConfiguration', async () => {
            const config = this.modelService.createConfiguration();
            this.modelService.addConfiguration(config);
            try {
                await this.modelService.save();
            } catch (e) {
                console.log(`Error saving configurtion data: ${e}`);
                vscode.window.showErrorMessage(e);
                return;
            }
            this.configEditorService.openConfiguration(config).catch(e => {
                console.log(`Error opening configuration ${config} with error: ${e}`)
            });
            this.dataProvider.refresh();
        }));
        this.context.subscriptions.push(vscode.commands.registerCommand('rhamt.openConfiguration', item => {
            this.configEditorService.openConfiguration(item.config).catch(e => {
                console.log(`Error opening configuration ${item.config} with error: ${e}`)
            });
        }));
        this.dataProvider.context.subscriptions.push(vscode.commands.registerCommand('rhamt.previewQuickfix', item => {
            Diff.compare(item.quickfix);
        }));
    }

    private createViewer(): vscode.TreeView<any> {
        const treeDataProvider = this.dataProvider;
        const viewer = vscode.window.createTreeView('rhamtExplorerView', { treeDataProvider });
        this.context.subscriptions.push(viewer);
        this.dataProvider.view = viewer;
        return viewer;
    }

    private createDataProvider(): DataProvider {
        const provider: DataProvider = new DataProvider(this.grouping, this.modelService, this.context);
        this.context.subscriptions.push(provider);
        return provider;
    }
}