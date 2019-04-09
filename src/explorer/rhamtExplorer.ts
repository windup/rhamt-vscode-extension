import * as vscode from 'vscode';
import { DataProvider } from '../tree/DataProvider';
import { ModelService } from '../model/modelService';
import { ITreeNode } from '../tree/abstractNode';
import { OptionsBuilder } from '../optionsBuilder';
import { RhamtUtil } from '../server/rhamtUtil';

export class RhamtExplorer {

    private dataProvider: DataProvider;

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
                this.dataProvider.refresh();
                this.modelService.addConfiguration(config);
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
    }

    private createViewer(): vscode.TreeView<ITreeNode> {
        const treeDataProvider = this.dataProvider;
        const viewer = vscode.window.createTreeView('rhamtExplorerView', { treeDataProvider });
        this.context.subscriptions.push(viewer);
        return viewer;
    }

    private createDataProvider(): DataProvider {
        const provider: DataProvider = new DataProvider(this.modelService);
        this.context.subscriptions.push(provider);
        return provider;
    }
}