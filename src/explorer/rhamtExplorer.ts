import * as vscode from 'vscode';
import { DataProvider } from '../tree/dataProvider';
import { ModelService } from '../model/modelService';
import { ReportHolder } from '../model/model';
import { OptionsBuilder } from '../optionsBuilder';
import { RhamtUtil } from '../server/rhamtUtil';
import { AnalysisResultsUtil } from '../model/analysisResults';
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
                this.modelService.addConfiguration(config);
                this.dataProvider.refresh();
                vscode.window.showInformationMessage(`Successfully Created: ${config.name}`);
                const run = await vscode.window.showQuickPick(['Yes', 'No'], {placeHolder: 'Run the analysis?'});
                if (!run || run === 'No') {
                    return;
                }
                try {
                    RhamtUtil.analyze(config, this.modelService);
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
        this.context.subscriptions.push(vscode.commands.registerCommand('rhamt.openReport', item => {
            if (this.isReportHolder(item)) {
                AnalysisResultsUtil.openReport((item as ReportHolder).getReport());
            }
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

    private isReportHolder(object: any): object is ReportHolder {
        return 'getReport' in object;
    }
}