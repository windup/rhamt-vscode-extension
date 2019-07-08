import { ConfigurationClient } from './configurationClient';
import * as os from 'os';
import { workspace, commands, window, Uri } from 'vscode';
import * as nls from 'vscode-nls';
import { RhamtConfiguration } from '../model/model';

const localize = nls.loadMessageBundle();

export class ConfigurationClientsManager {

    private clients: Map<string, ConfigurationClient> = new Map<string, ConfigurationClient>();
    private config: RhamtConfiguration;

    constructor(config: RhamtConfiguration) {
        this.config = config;
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
        client.onAddOptionValue.on(data => {
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
        });
        client.onUpdateOption.on(data => {
            if (!data.value) {
                delete this.config.options[data.name];
            }
            else {
                this.config.options[data.name] = data.value;
            }
            this.clients.forEach(c => {
                c.notifyUpdateOption(data, this.config.options);
            });
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
            }
        });
    }

    report(msg: string): void {
        this.clients.forEach(client => {
            client.report(msg);
        });
    }

    done(): void {
    }

    openReport(): void {
        commands.executeCommand('rhamt.openReport', this.config);
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