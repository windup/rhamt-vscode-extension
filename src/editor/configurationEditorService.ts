/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { ConfigurationView } from './configurationView';
import { ExtensionContext } from 'vscode';
import { RhamtConfiguration } from '../server/analyzerModel';
import * as vscode from 'vscode';
import { ModelService } from '../model/modelService';

export class ConfigurationEditorService {

    private editors: Map<string, ConfigurationView> = new Map<string, ConfigurationView>();
    private context: ExtensionContext;
    private modelService: ModelService;

    constructor(context: ExtensionContext, modelService: ModelService) {
        this.context = context;
        this.modelService = modelService;
    }

    async openConfiguration(configuration: RhamtConfiguration, view?: vscode.WebviewPanel): Promise<void> {
        let editor = this.editors.get(configuration.id);
        if (!editor) {
            editor = new ConfigurationView(configuration, this.modelService, this.context, view);
            this.editors.set(configuration.id, editor);
        }
        await editor.open();
    }

    closeEditor(configuration: RhamtConfiguration) {
        let editor = this.editors.get(configuration.id);
        if (editor) {
            editor.close();
            this.editors.delete(configuration.id);
        }
    }
}