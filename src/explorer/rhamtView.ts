/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';
import { RhamtExplorer } from './rhamtExplorer';
import { ModelService } from '../model/modelService';
import { ConfigurationEditorService } from '../editor/configurationEditorService';
import { MarkerService } from '../source/markers';
import { LensProvider } from '../source/lensProvider';

export class RhamtView {

    constructor(private context: vscode.ExtensionContext,
        private modelService: ModelService,
        private configEditorService: ConfigurationEditorService,
        private markerService: MarkerService,
        private lensProvider: LensProvider) {
        this.createExplorer();
    }

    private createExplorer(): RhamtExplorer {
        return new RhamtExplorer(
            this.context,
            this.modelService,
            this.configEditorService,
            this.markerService,
            this.lensProvider);
    }
}