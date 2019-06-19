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

export class RhamtExplorer {

    private dataProvider: DataProvider;
    private grouping: Grouping = {
        groupByFile: true,
        groupBySeverity: false
    };

    constructor(private context: vscode.ExtensionContext,
        private modelService: ModelService) {
        this.dataProvider = this.createDataProvider();
        this.createViewer();
        this.createCommands();
    }

    private createCommands(): void {
        this.context.subscriptions.push(vscode.commands.registerCommand('rhamt.createConfiguration', async () => {
            const config = await OptionsBuilder.build(this.modelService);
            if (config) {
                await this.modelService.addConfiguration(config);
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
                }
            }
        }));
        this.context.subscriptions.push(vscode.commands.registerCommand('rhamt.deleteConfiguration', item => {
            const config = item.config;
            this.modelService.deleteConfiguration(config);
            this.dataProvider.refresh();
        }));
        this.dataProvider.context.subscriptions.push(vscode.commands.registerCommand('rhamt.deleteIssue', item => {
            item.root.deleteIssue(item);
        }));
        this.dataProvider.context.subscriptions.push(vscode.commands.registerCommand('rhamt.markIssueAsComplete', item => {
            item.root.markIssueAsComplete(item);
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
            await this.modelService.addConfiguration(config);
            vscode.commands.executeCommand('rhamt.openConfiguration', config);
            this.dataProvider.refresh();
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