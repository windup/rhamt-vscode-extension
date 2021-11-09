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
import { applyQuickfixes, applyQuickfix, Quickfix } from '../quickfix/quickfix';
import { RhamtConfiguration } from '../model/model';
import { MarkerService } from '../source/markers';
import { LensProvider } from '../source/lensProvider';

export class RhamtExplorer {

    private dataProvider: DataProvider;

    private grouping: Grouping = {
        groupByFile: true,
        groupBySeverity: false
    };

    constructor(private context: vscode.ExtensionContext,
        private modelService: ModelService,
        private configEditorService: ConfigurationEditorService,
        private markerService: MarkerService,
        private lensProvider: LensProvider) {
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
            item.root.setComplete(item, true);
            this.modelService.saveAnalysisResults(item.root.config).catch(e => {
                console.log(`Error saving analysis results: ${e}`);
                vscode.window.showErrorMessage(e);
            });
        }));
        this.dataProvider.context.subscriptions.push(vscode.commands.registerCommand('rhamt.markIssueAsIncomplete', item => {
            item.root.setComplete(item, false);
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
        this.dataProvider.context.subscriptions.push(vscode.commands.registerCommand('rhamt.applyQuickfix', async (item) => {
            try {
                await applyQuickfix(item.quickfix);
                item.applyQuickfix(true);
                this.modelService.saveAnalysisResults(item.config).catch(e => {
                    console.log(`Error saving analysis results after quickfix: ${e}`);
                    vscode.window.showErrorMessage(e);
                });
            }
            catch (e) {
                console.log(`Error applying quickfix - ${e}`);
                vscode.window.showErrorMessage(`Error applying quickfix ${e}`);
            }
        }));
        this.dataProvider.context.subscriptions.push(vscode.commands.registerCommand('rhamt.applyAllQuickfixes', async (item) => {
            try {
                await Quickfix.applyAllQuickfixes(item);
                this.modelService.saveAnalysisResults(item.config).catch(e => {
                    console.log(`Error saving analysis results after applying all quickfixes: ${e}`);
                    vscode.window.showErrorMessage(e);
                });
            }
            catch (e) {
                console.log(`Error applying quickfix - ${e}`);
                vscode.window.showErrorMessage(`Error applying quickfix ${e}`);
            }
        }));
        this.dataProvider.context.subscriptions.push(vscode.commands.registerCommand('rhamt.markAsUnapplied', async (item) => {
            try {
                item.applyQuickfix(false);
                this.modelService.saveAnalysisResults(item.config).catch(e => {
                    console.log(`Error saving analysis results after quickfix: ${e}`);
                    vscode.window.showErrorMessage(e);
                });
            }
            catch (e) {
                console.log(`Error applying quickfix - ${e}`);
                vscode.window.showErrorMessage(`Error applying quickfix ${e}`);
            }
        }));
        this.dataProvider.context.subscriptions.push(vscode.commands.registerCommand('rhamt.applyQuickfixes', async (item) => {
            try {
                await applyQuickfixes(item.quickfixes);
            }
            catch (e) {
                console.log(`Error applying quickfixes - ${e}`);
                vscode.window.showErrorMessage(`Error applying quickfixes ${e}`);
            }
        }));
        this.dataProvider.context.subscriptions.push(vscode.commands.registerCommand('rhamt.activate', async (item) => {
            try {
                const config = item.config as RhamtConfiguration;
                config.summary.active = config.summary.activatedExplicity = true;
                // Expand doesn't work, if the configuration has been manually collapsed, it doesn't get expanded.
                const configNode = this.dataProvider.getConfigurationNode(config);
                configNode.expand();
                this.refreshConfigurations();
                this.lensProvider.refresh();
                this.markerService.refreshOpenEditors();
                await this.saveModel();
            }
            catch (e) {
                console.log(`Error activating configuration - ${e}`);
                vscode.window.showErrorMessage(`Error activating configuration ${e}`);
            }
        }));
        this.dataProvider.context.subscriptions.push(vscode.commands.registerCommand('rhamt.deactivate', async (item) => {
            try {
                const config = item.config as RhamtConfiguration;
                config.summary.active = config.summary.activatedExplicity = false;
                this.refreshConfigurations();
                this.lensProvider.refresh();
                this.markerService.refreshOpenEditors();
                this.saveModel();
            }
            catch (e) {
                console.log(`Error unactivating configuration - ${e}`);
                vscode.window.showErrorMessage(`Error unactivating configuration ${e}`);
            }
        }));
        this.dataProvider.context.subscriptions.push(vscode.commands.registerCommand('rhamt.runConfiguration', async (item) => {
            // TODO: Set buy indicator on configuration being ran, and update it accordingly if cancelled, errored, or finished.
            const config = item.config;
            try {
                RhamtUtil.updateRunEnablement(false, this.dataProvider, config);
                await RhamtUtil.analyze(
                    this.dataProvider,
                    config,
                    this.modelService,
                    () => {
                        const output = config.options['output'];
                        if (output) {
                            this.modelService.deleteOuputLocation(output);
                        }
                        config.results = undefined;
                        config.summary = undefined;
                        this.dataProvider.refreshRoots();
                    },
                    async () => {
                        RhamtUtil.updateRunEnablement(true, this.dataProvider, config);
                        // Expand doesn't work, if the configuration has been manually collapsed, it doesn't get expanded.
                        const configNode = this.dataProvider.getConfigurationNode(config);
                        configNode.expand();
                        this.dataProvider.refreshRoots();
                        this.markerService.refreshOpenEditors();
                        this.saveModel();
                    });
            } catch (e) {
                console.log(e);
                if (!e.notified) {
                    vscode.window.showErrorMessage(`Error running analysis - ${e}`);
                }
                RhamtUtil.updateRunEnablement(true, this.dataProvider, config);
                this.dataProvider.reload(config);
            }
        }));
        RhamtUtil.updateRunEnablement(true, this.dataProvider, null);
    }

    private async saveModel(): Promise<void> {
        try {
            // save analysis results, quickfix info, active analysis, etc.
            await this.modelService.save();
        }
        catch (e) {
            console.log(`Error saving analysis results: ${e}`);
            return Promise.reject(`Error saving analysis results: ${e}`);
        }
    }


    private refreshConfigurations(): void {
        this.dataProvider.refreshRoots();
    }

    private createViewer(): vscode.TreeView<any> {
        const treeDataProvider = this.dataProvider;
        const viewer = vscode.window.createTreeView('rhamtExplorerView', { treeDataProvider });
        // viewer.onDidExpandElement(e => {
        //     console.log(e.element);
        //     if (e.element instanceof FolderNode) {
        //     }
        // });
        this.context.subscriptions.push(viewer);
        this.dataProvider.setView(viewer);
        return viewer;
    }

    private createDataProvider(): DataProvider {
        const provider: DataProvider = new DataProvider(
            this.grouping,
            this.modelService,
            this.context,
            this.markerService);
        this.context.subscriptions.push(provider);
        return provider;
    }
}