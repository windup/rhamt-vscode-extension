/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';
import { DataProvider } from '../tree/dataProvider';
import { ModelService } from '../model/modelService';
import { RhamtUtil } from '../server/rhamtUtil';
import { Grouping } from '../tree/configurationNode';
import { ConfigurationEditorService } from '../editor/configurationEditorService';
import { Diff } from '../quickfix/diff';
import { applyQuickfixes, applyQuickfix } from '../quickfix/quickfix';
import { Endpoints } from '../model/model';

export class RhamtExplorer {

    private dataProvider: DataProvider;
    private grouping: Grouping = {
        groupByFile: true,
        groupBySeverity: false
    };

    constructor(private context: vscode.ExtensionContext,
        private modelService: ModelService,
        private configEditorService: ConfigurationEditorService,
        private endpoints: Endpoints) {
        this.dataProvider = this.createDataProvider();
        this.createViewer();
        this.createCommands();
    }

    private createCommands(): void {
        this.context.subscriptions.push(vscode.commands.registerCommand('rhamt.deleteConfiguration', async item => {
            const config = item.config;
            try {
                const deleted = await this.modelService.deleteConfiguration(config);
                if (deleted) {
                    this.configEditorService.closeEditor(config);
                }
                this.dataProvider.remove(config);
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
            item.config.summary = undefined;
            this.dataProvider.reload(item.config);
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
            this.dataProvider.refresh(undefined);
        }));
        this.context.subscriptions.push(vscode.commands.registerCommand('rhamt.openConfiguration', item => {
            this.configEditorService.openConfiguration(item.config).catch(e => {
                console.log(`Error opening configuration ${item.config} with error: ${e}`)
            });
        }));
        this.dataProvider.context.subscriptions.push(vscode.commands.registerCommand('rhamt.previewQuickfix', item => {
            Diff.openQuickfixPreview(item);
        }));
        this.dataProvider.context.subscriptions.push(vscode.commands.registerCommand('rhamt.applyQuickfix', item => {
            try {
                applyQuickfix(item.quickfix);
            }
            catch (e) {
                console.log(`Error applying quickfix - ${e}`);
                vscode.window.showErrorMessage(`Error applying quickfix ${e}`);
            }
        }));
        this.dataProvider.context.subscriptions.push(vscode.commands.registerCommand('rhamt.applyQuickfixes', item => {
            try {
                applyQuickfixes(item.quickfixes);
            }
            catch (e) {
                console.log(`Error applying quickfixes - ${e}`);
                vscode.window.showErrorMessage(`Error applying quickfixes ${e}`);
            }
        }));
        this.dataProvider.context.subscriptions.push(vscode.commands.registerCommand('rhamt.runConfiguration', async (item) => {
            const config = item.config;
            try {
                RhamtUtil.updateRunEnablement(false);
                await RhamtUtil.analyze(
                    config,
                    this.modelService,
                    () => {
                        const output = config.options['output'];
                        if (output) {
                            this.modelService.deleteOuputLocation(output);
                        }
                        config.results = undefined;
                        config.summary = undefined;
                        this.dataProvider.reload(config);
                    },
                    () => {
                        RhamtUtil.updateRunEnablement(true);
                        this.dataProvider.reload(config);
                    });
            } catch (e) {
                console.log(e);
                vscode.window.showErrorMessage(`Error running analysis - ${e}`);
                RhamtUtil.updateRunEnablement(true);
            }
        }));
        RhamtUtil.updateRunEnablement(true);
    }

    private createViewer(): vscode.TreeView<any> {
        const treeDataProvider = this.dataProvider;
        const viewer = vscode.window.createTreeView('rhamtExplorerView', { treeDataProvider });
        this.context.subscriptions.push(viewer);
        this.dataProvider.setView(viewer);
        return viewer;
    }

    private createDataProvider(): DataProvider {
        const provider: DataProvider = new DataProvider(
            this.grouping,
            this.modelService,
            this.context,
            this.endpoints);
        this.context.subscriptions.push(provider);
        return provider;
    }
}