/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';
import { ConfigurationEditorService } from './configurationEditorService';
import { ModelService } from '../model/modelService';

export class ConfigurationEditorSerializer implements vscode.WebviewPanelSerializer {
    constructor(private modelService: ModelService, private editorService: ConfigurationEditorService) {
    }
    async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
        if (!process.env.CHE_WORKSPACE_NAMESPACE) {
            try {
                await this.modelService.load();
                const configuration = this.modelService.getConfiguration(state.id);
                if (!configuration) {
                    vscode.window.showErrorMessage(`Unable to restore MTA configuration editor state.`);
                    webviewPanel.dispose();
                }
                else {
                    this.editorService.openConfiguration(configuration, webviewPanel);
                }
            }
            catch (e) {
                console.log(`Error with deserializeWebviewPanel restoration: ${e}`);
                vscode.window.showErrorMessage(`Error restoring MTA configuration editor.`);
                webviewPanel.dispose();
            }
        }
        else {
            webviewPanel.dispose();
        }
    }
}
