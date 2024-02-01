/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';
import { DataProvider } from '../tree/dataProvider';
import { ModelService } from '../model/modelService';
import { ConfigurationEditorService } from '../editor/configurationEditorService';
import { RhamtConfiguration } from '../server/analyzerModel';
import { MarkerService } from '../source/markers';
import { Grouping } from '../tree/configurationNode';
import { AnalyzerUtil } from '../server/analyzerUtil';

export class RhamtExplorer {

    private dataProvider: DataProvider;

    private grouping: Grouping = {
        groupByFile: true,
        groupBySeverity: false
    };

    constructor(private context: vscode.ExtensionContext,
        private modelService: ModelService,
        private configEditorService: ConfigurationEditorService,
        private markerService: MarkerService) {
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
                if (AnalyzerUtil.activeProcessController) {
                    AnalyzerUtil.activeProcessController.shutdown();
                }
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
            this.refreshConfigurations();
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
            await this.configEditorService.openConfiguration(config).catch(e => {
                console.log(`Error opening configuration ${config} with error: ${e}`)
            });
            this.dataProvider.refresh(undefined);
        }));
        this.context.subscriptions.push(vscode.commands.registerCommand('rhamt.openConfiguration', item => {
            this.configEditorService.openConfiguration(item.config).catch(e => {
                console.log(`Error opening configuration ${item.config} with error: ${e}`)
            });
        }));
        this.dataProvider.context.subscriptions.push(vscode.commands.registerCommand('rhamt.activate', async (item) => {
            try {
                const config = item.config as RhamtConfiguration;
                config.summary.active = config.summary.activatedExplicity = true;
                const configNode = this.dataProvider.getConfigurationNode(config);
                this.refreshConfigurations();
                this.dataProvider.reveal(configNode, true);
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
                this.markerService.refreshOpenEditors();
                this.saveModel();
            }
            catch (e) {
                console.log(`Error unactivating configuration - ${e}`);
                vscode.window.showErrorMessage(`Error unactivating configuration ${e}`);
            }
        }));
        this.dataProvider.context.subscriptions.push(vscode.commands.registerCommand('rhamt.runConfiguration', async (item) => {
            if (!item) {
                const configs = this.modelService.model.configurations.map(config => config.name);
                const choice = await vscode.window.showQuickPick(configs);
                if (choice) {
                    const config = this.modelService.getConfigurationWithName(choice);
                    item = {config};
                }
                else {
                    return;
                }                
            }
            const config = item.config as RhamtConfiguration;
            try {
                AnalyzerUtil.updateRunEnablement(false, this.dataProvider, config);
                await AnalyzerUtil.analyze(
                    this.dataProvider,
                    config,
                    this.modelService,
                    () => {
                        config.results = undefined;
                        config.summary = undefined;
                        this.refreshConfigurations();
                    },
                    () => {});
                    if (config.cancelled) return;
                    await AnalyzerUtil.loadAnalyzerResults(config);
                        AnalyzerUtil.updateRunEnablement(true, this.dataProvider, config);
                        const configNode = this.dataProvider.getConfigurationNode(config);
                        configNode.loadResults();
                        this.refreshConfigurations();
                        this.dataProvider.reveal(configNode, true);
                        this.markerService.refreshOpenEditors();
                        this.saveModel();
                        console.log('\nAnalysis completed successfully');
                        vscode.window.showInformationMessage('Analysis complete', 'Open Report').then(result => {
                            if (result === 'Open Report') {
                                vscode.commands.executeCommand('rhamt.openReportExternal', {
                                    config,
                                    getReport: () => config.getReport()
                                });
                            }
                        });

            } catch (e) {
                console.log(e);
                console.log('\nAnalysis failed');
                if (!e.notified) {
                    vscode.window.showErrorMessage(`Error running analysis - ${e}`);
                }
                AnalyzerUtil.updateRunEnablement(true, this.dataProvider, config);
                this.refreshConfigurations();
            }
        }));
        AnalyzerUtil.updateRunEnablement(true, this.dataProvider, null);
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