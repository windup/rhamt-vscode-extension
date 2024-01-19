/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { rhamtEvents } from '../events';
import { WebviewPanel, window, ViewColumn, Uri, ExtensionContext, workspace } from 'vscode';
import * as path from 'path';
import { ChangeType, RhamtConfiguration } from '../server/analyzerModel';
import * as vscode from 'vscode';
import { ModelService } from '../model/modelService';
import * as os from 'os';
import * as nls from 'vscode-nls';

const localize = nls.loadMessageBundle();

const openEditors: ConfigurationView[] = [];

export function getOpenEditors() {
    return openEditors;
}

export class ConfigurationView {

    onEditorClosed = new rhamtEvents.TypedEvent<void>();

    private configuration: RhamtConfiguration;
    private modelService: ModelService;
    private view: WebviewPanel | undefined = undefined;
    private context: ExtensionContext;

    constructor(configuration: RhamtConfiguration, modelService: ModelService, context: ExtensionContext, webview?: WebviewPanel) {
        this.configuration = configuration;
        this.modelService = modelService;
        this.context = context;
        this.configuration.options['cloning'] = [];
        if (webview) {
            this.view = webview;
            this.setupView();
        }
    }

    async open(): Promise<void> {
        if (!this.view) {
            try {
                this.view = window.createWebviewPanel('rhamtConfigurationEditor', this.configuration.name, ViewColumn.Active, {
                    enableScripts: true,
                    retainContextWhenHidden: true,
                    localResourceRoots: [Uri.file(path.join(this.context.extensionPath, 'resources', 'configuration'))]
                });
            } catch (e) {
                console.log(`Error creating webview panel: ${e}`);
            }
            try {
                await this.setupView();
            } catch (e) {
                console.log(`Error at setupView: ${e}`);
            }
            openEditors.push(this);
        }
        this.view.reveal();
    }

    updateTitle(title: string) {
        if (this.view) {
            this.view.title = title;
            this.view.reveal;
        }
    }

    public refresh() {
        if (this.view) {
            this.updateTitle(this.configuration.name);
            this.bindView();
        }
    }

    private async setupView(): Promise<void> {
        const changeListener = change => {
            if (this.view) {
                if (change.type === ChangeType.MODIFIED && change.name === 'name') {
                    this.updateTitle(this.configuration.name);
                }
            }
        };
        this.configuration.onChanged.on(changeListener);
        this.view.onDidDispose(() => {
            this.view = undefined;
            const viewIndex = openEditors.indexOf(this);
            if (viewIndex > -1) {
                openEditors.splice(viewIndex, 1);
            }
            this.configuration.onChanged.off(changeListener);
            this.onEditorClosed.emit(undefined);
        });
        this.view.webview.html = this.render();
        this.view.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'updateOption':
                    this.updateOption(message.option);
                    return;
                case 'addOptionValue':
                    this.addOptionValue(message.option);
                    return;
                case 'promptExternal':
                    this.promptExternal(message.option);
                    return;
                case 'showRecentRulesets':
                    this.showRecentRulesets(message.option);
                    return;
                case 'ready':
                    this.bindView();
                    return;
            }
        });
        this.view.reveal();
    }

    private bindView() {
        const config = this.computeConfigData();
        const elementData = this.modelService.elementData;
        this.postMessage({command: 'bind', config, elementData});
    }

    private computeConfigData() {
        return {
            id: this.configuration.id,
            name: this.configuration.name,
            options: this.configuration.options
        };
    }

    private postMessage(msg: any): void {
        this.view.webview.postMessage(msg);
    }

    async close() {
        if (this.view) {
            this.view.dispose();
        }
    }

    private render(): string {
        const body = this.getHtmlBody();
        const styleUri = this.view.webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'resources', 'configuration', 'main.css'));
        const jsUri = this.view.webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'resources', 'configuration', 'configurationEditor.js'));
        const jqueryUri = this.view.webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'resources', 'configuration', 'jquery-3.3.1.min.js'));
        const bootstrap = this.view.webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'resources', 'configuration', 'bootstrap.5.1.3.min.css'));
        return `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta http-equiv="Content-Security-Policy" content="">
                    <script>
                        vscode = acquireVsCodeApi();
                        vscode.setState({id: "${this.configuration.id}"});
                    </script>
                    <script src="${jqueryUri}"></script>
                    <link href="${styleUri}" rel="stylesheet" />
                    <link rel="stylesheet" href="${bootstrap}" >
                </head>
                <body>
                    <div style="overflow:hidden;overflow-x:hidden;overflow-y:hidden;height:100%;width:100%;position:absolute;top:0px;left:0px;right:0px;bottom:0px; background-color: var(--vscode-editor-background); color: var(--vscode-foreground);" height="100%" width="100%">
                        ${body}
                    </div>
                    <script src="${jsUri}"></script>
                    <script>
                        (function() {
                            $('.overlay-container').click(() => {
                                this.hideEditDialog();
                            });
                            $('.overlay-container *').click(function (e) {
                                e.stopPropagation();
                            });
                            $('.recent-container').click(() => {
                                this.hideRecentDialog();
                            });
                            $('.recent-container *').click(function (e) {
                                e.stopPropagation();
                            });
                            $(document).keyup(e => {
                                if (e.key === 'Escape') {
                                    this.hideEditDialog();
                                    this.hideRecentDialog();
                                }
                                else if (e.which === 13 && $('.recent-container').is(':visible')) {
                                    this.hideRecentDialog();
                                    this.updateRulesetsOption();
                                }
                            });
                            $('#elementForm').on('click', 'div.table-row', e => {
                                if ($(e.target).hasClass('delete-action')) {
                                    return;
                                }
                                $('div.table-row').removeClass('selected');
                                const container = $(e.target).closest('.table-row');
                                console.log(container);
                            });
                        })();
                    </script>
                </body>
            </html>
        `;
    }

    private getHtmlBody() {
        return `
        <div class="monaco-shell">
        <div class="manaco-shell-content">
          <div class="app-shell" style="position:absolute;">
            <div class="monaco-workbench-container" style="position: relative; height: 100%; ">
              <div class="monaco-workbench mac" style="height:100%;">
                <div class="part editor" style="position: relative; height: 100%;">
                  <div class="content" style="height:100%;">                  
                      <div class="overlay-container" style="position: absolute; width: 100%; z-index: 10000; height: 100%; display: none;">
                        <div class="defineKeybindingWidget" style="width: 400px; height: 110px; background-color: var(--vscode-editor-background); border: 1px solid rgb(168 168 189); position: unset; margin: auto; margin-top: 150px;">
                          <div style="text-align: center;">Enter desired value and then press ENTER.</div>
                          <div class="settings-header-widget">
                            <div class="settings-search-container">
                              <div class="settings-search-input">
                                <div class="monaco-inputbox idle" style="width: unset;">
                                  <div class="wrapper">
                                    <input id='editDialogInput' class="input" autocorrect="off" autocapitalize="off" spellcheck="false" type="text"
                                      wrap="off" aria-label="Press desired key combination and then press ENTER." aria-live="off" style="cpadding: 4px;">                                  
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div style="margin-top: 10px; text-align: center">
                              <span id="openButton" style="text-decoration: underline; cursor: pointer; display: none;">Open File Explorer</span>
                          </div>
                        </div>
                      </div>
                      <div class="recent-container" style="position: absolute; width: 100%; z-index: 10000; height: 100%; display: none;">
                        <div class="defineKeybindingWidget" style="width: 550px; background-color: var(--vscode-editor-background); border: 1px solid rgb(168 168 189); position: unset; margin: auto; margin-top: 150px;">
                          <div id="select-recent-label" style="text-align: center;">Select rulesets and then press ENTER.</div>
                          <div class="settings-header-widget" style="  height: 110px; overflow: auto;">
                            <div class="settings-search-container">
                              <div class="settings-search-input">
                                <div class="monaco-inputbox idle" style="border: none; width: unset; outline-style: none;">
                                  <div class="wrapper">
                                    <div class="recent-wrapper">
                                      <div id="no-rulesets-placeholder" style="display: none; margin-top: 40px;">No recent rulesets.</div>
                                      <table id="recent-table" style="margin-top: 10px; text-align: left; width: 100%;" class="recent-table">
                                      </table>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    <div class="editor-container app-container">
                      <div class="editor-instance app-instance" style="height: 100%; margin: auto; max-width: 900px;">
                        <div class="extension-editor" style="height:100%; padding: 0px;  margin: 0px;">
                              <div class="my-wrapper">                              
                                        <div style="max-width: 900px; margin: auto; position: relative; padding-right: 10px;">
                                  <div style="position: relative; right: -10px;">
                                  <div style="margin-left: 10px;">                                 
                                <div class="d-flex" style="margin-top: 15px;">
                                    <div class="" style="width: 80%">
                                        <form id='elementForm'>
                                        </form>
                                    </div>
                                    <div class="" style="width: 40%; margin-left: 20px">
                                    </div>
                                </div>
                                    </div>
                                  </div>
                                  <div>
                                  </div>
                                </div>
                                </div>
                                  </div>
                                </div>
                                </div>
                              </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
        `;
    }

    private updateOption(data: any): void {
        if (data.name === 'name') {
            let newName = data.value;
            if (!newName) {
                newName = this.modelService.generateConfigurationName();
            }
            this.configuration.name = newName;
            this.configuration.onChanged.emit({type: ChangeType.MODIFIED, name: 'name', value: data.name});
        }
        else if (!data.value) {
            delete this.configuration.options[data.name];
        }
        else {
            this.configuration.options[data.name] = data.value;
        }
        this.postMessage({
            command: 'updateOption',
            option: data,
            options: this.configuration.options
        });
        this.save();
    }

    private addOptionValue(data: any) {
        const values = this.configuration.options[data.option.name];
        if (values) {
            this.configuration.options[data.option.name] = values.concat(data.value);
        }
        else {
            this.configuration.options[data.option.name] = [data.value];
        }

        // cloning...
        const optionName = data.option.name;
        const value = data.value as string;
        let cloning = false;
        if (optionName === 'input' && value.includes('github.com/')) {
            cloning = true;
            console.log('execute clone repository: ' + value);
            const values = this.configuration.options['cloning'];
            if (values) {
                this.configuration.options['cloning'] = values.concat(data.value);
            }
            else {
                this.configuration.options['cloning'] = [data.value];
            }
        }

        this.postMessage({
            command: 'updateOption',
            option: data.option,
            options: this.configuration.options
        });

        // cloning...
        if (cloning) {
            if (vscode.workspace.workspaceFolders) {
                const workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
                const folderName = data.value.substring(data.value.lastIndexOf('/') + 1);
                const cloneCommand = {repo: data.value, folderName, config: this.configuration, workspaceFolder};
                vscode.commands.executeCommand('rhamt.downloadGitRepo', cloneCommand).then((result:any) => {

                    // remove url from list of cloning urls, also delete duplicates
                    const cloningValues = this.configuration.options['cloning'];
                    let cloningIndex = cloningValues.indexOf(result.repo);
                    while (cloningIndex > -1) {
                        cloningValues.splice(cloningIndex, 1);
                        cloningIndex = cloningValues.indexOf(result.repo); 
                    }

                    const inputValues = this.configuration.options['input'];
                    const location = path.join(result.workspaceFolder, result.folderName);

                    // if error cloning, remove url from input list, also delete duplicates
                    if (result.error) {
                        let index = inputValues.indexOf(result.repo);
                        while (index > -1) {
                            inputValues.splice(index, 1);
                            index = inputValues.indexOf(result.repo);
                        }

                        // add it to input if not already exists
                        index = inputValues.indexOf(location);
                        if (index === -1) {
                            inputValues.push(location);
                        }
                    }
                    else {
                        // delete other duplicate input locations
                        let duplicateIndex = inputValues.indexOf(location);
                        while (duplicateIndex > -1) {
                            inputValues.splice(duplicateIndex, 1);
                            duplicateIndex = inputValues.indexOf(location);
                        }

                        let repoUrlIndex = inputValues.indexOf(result.repo);
                        if (repoUrlIndex > -1) {
                            // tag original, so we don't delete it
                            const newInput = location + '-og';
                            inputValues[repoUrlIndex] = newInput;

                            // delete other duplicates
                            repoUrlIndex = inputValues.indexOf(result.repo);
                            while(repoUrlIndex > -1) {
                                inputValues.splice(repoUrlIndex, 1);
                                repoUrlIndex = inputValues.indexOf(result.repo);
                            }

                            // remove temp tag
                            repoUrlIndex = inputValues.indexOf(newInput);
                            inputValues[repoUrlIndex] = location;
                        }
                    }
                    setTimeout(() => {
                        this.postMessage({
                            command: 'updateOption',
                            option: data.option,
                            options: this.configuration.options
                        });
                    }, 1000);
                });
            }
            else {
                const msg = `Cannot find workspace folder to clone into.`;
                console.log(msg);
                vscode.window.showErrorMessage(msg);
            }
        }

        this.save();

        return Promise.resolve();
    }

    private async promptExternal(option: any): Promise<void> {
        const files = option['ui-type'].includes('file_or_directory');
        const folders = option['ui-type'].includes('file_or_directory') || option['ui-type'].includes('directory');
        const many = option['ui-type'].includes('many');
        const result = await this.doPromptExternal(files, folders, many);
        if (result) {
            if (option['ui-type'].includes('many')) {
                if (this.configuration.options[option.name]) {
                    this.configuration.options[option.name] = this.configuration.options[option.name].concat(result);
                }
                else {
                    this.configuration.options[option.name] = result;
                }
            }
            else {
                this.configuration.options[option.name] = result[0];
            }
            this.postMessage({
                command: 'updateOption',
                option: option,
                options: this.configuration.options
            });
            this.save();
        }
    }

    private async doPromptExternal(canSelectFiles: boolean, canSelectFolders: boolean, canSelectMany: boolean): Promise<any> {
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

    private showRecentRulesets(option: any): void {
        this.postMessage({
            command: 'showRecentRulesets',
            option,
            rulesets: this.modelService.getRulesets()
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
}
