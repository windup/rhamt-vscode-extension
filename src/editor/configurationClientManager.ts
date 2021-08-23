/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';
import { ConfigurationClient } from './configurationClient';
import * as os from 'os';
import { workspace, commands, window, Uri } from 'vscode';
import * as nls from 'vscode-nls';
import { RhamtConfiguration, ChangeType } from '../model/model';
import { ModelService } from '../model/modelService';

const localize = nls.loadMessageBundle();

export class ConfigurationClientManager {

    private clients: Map<string, ConfigurationClient> = new Map<string, ConfigurationClient>();
    private config: RhamtConfiguration;
    private modelService: ModelService;

    constructor(config: RhamtConfiguration, modelService: ModelService) {
        this.config = config;
        this.modelService = modelService;
    }

    notifyStopped(): void {
        this.clients.forEach(client => {
            client.analysisStopped();
        });
    }

    notifyStartingAnalysis(): void {
        this.clients.forEach(client => {
            client.notifyStartingAnalysis();
        });
    }

    notifyAnalyzing(): void {
        this.clients.forEach(client => {
            client.notifyAnalyzing();
        });
    }

    notifyErrorStartingAnalysis(e: any): void {
    }

    notifyThemeChanged(theme: string): void {
        this.clients.forEach(client => {
            client.notifyThemeChanged(theme);
        });
    }

    connectClient(client: ConfigurationClient): void {
        this.clients.set(client.id, client);
        this.initClient(client);
        client.listen();
    }

    disconnectClient(client: ConfigurationClient): void {
        this.clients.delete(client.id);
    }

    private initClient(client: ConfigurationClient): void {
        client.onUpdateName.on(data => {});
        client.onUpdateJvm.on(data => {});
        client.onUpdateCli.on(data => {});
        client.onAddOptionValue.on(async data => {
            const values = this.config.options[data.option.name];
            if (values) {
                this.config.options[data.option.name] = values.concat(data.value);
            }
            else {
                this.config.options[data.option.name] = [data.value];
            }
            this.clients.forEach(c => {
                c.notifyUpdateOption(data.option, this.config.options);
            });
            this.save();
        });
        client.onUpdateOption.on(async data => {
            if (data.name === 'name') {
                let newName = data.value;
                if (!newName) {
                    newName = this.modelService.generateConfigurationName();
                }
                this.config.name = newName;
                this.config.onChanged.emit({type: ChangeType.MODIFIED, name: 'name', value: data.name});
            }
            else if (!data.value) {
                delete this.config.options[data.name];
            }
            else {
                this.config.options[data.name] = data.value;
            }
            this.clients.forEach(c => {
                c.notifyUpdateOption(data, this.config.options);
            });
            this.save();
        });
        client.onOpenReport.on(() => {
            this.openReport();
        });
        client.onCloneRepo.on(data => {});
        client.onStartAnalaysis.on(() => {});
        client.onCancelAnalaysis.on(() => {});
        client.onDisposed.on(data => {});
        client.onPromptWorkspaceFileOrFolder.on((option: any) => {});
        client.onPromptWorkspaceFolder.on(option => {});
        client.onPromptExternal.on(async (option: any) => {
            const files = option['ui-type'].includes('file_or_directory');
            const folders = option['ui-type'].includes('file_or_directory') || option['ui-type'].includes('directory');
            const many = option['ui-type'].includes('many');
            const result = await this.promptExternal(files, folders, many);
            if (result) {
                if (option['ui-type'].includes('many')) {
                    if (this.config.options[option.name]) {
                        this.config.options[option.name] = this.config.options[option.name].concat(result);
                    }
                    else {
                        this.config.options[option.name] = result;
                    }
                }
                else {
                    this.config.options[option.name] = result[0];
                }
                this.clients.forEach(c => {
                    c.notifyUpdateOption(option, this.config.options);
                });
                this.save();
            }
        });
    }

    private async save(): Promise<void> {
        try {
            await this.modelService.save();
        } catch (e) {
            console.log(`Error saving configurtion data: ${e}`);
            vscode.window.showErrorMessage(e);
            return;
        }
    }

    report(msg: string): void {
        this.clients.forEach(client => {
            client.report(msg);
        });
    }

    openReport(): void {
        commands.executeCommand('rhamt.openReportExternal', this.config);
    }

    async promptInput(): Promise<any> {
        return Promise.resolve(await window.showWorkspaceFolderPick({ placeHolder: 'Choose Workspace Folder' }));
    }

    private async promptExternal(canSelectFiles: boolean, canSelectFolders: boolean, canSelectMany: boolean): Promise<any> {
        const homeUri = Uri.file(os.homedir());
        const defaultUri = workspace.workspaceFolders && workspace.workspaceFolders.length > 0
            ? Uri.file(workspace.workspaceFolders[0].uri.fsPath)
            : homeUri;
        const result = await window.showOpenDialog({
            canSelectFiles,
            canSelectFolders,
            canSelectMany,
            defaultUri,
            openLabel: localize('choose', 'Choose...')
        });
        if (!result || result.length === 0) {
            return;
        }
        return [...result.map(item => item.fsPath)];
    }
}
