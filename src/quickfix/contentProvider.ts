/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from "vscode";
import { ModelService } from "../model/modelService";
import * as fs from 'fs';

export class QuickfixContentProvider implements vscode.TextDocumentContentProvider {

    constructor(private modelService: ModelService) {
    }
    
    provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): string { 
        const config = this.modelService.getConfiguration(uri.authority);
        let hintId = uri.path.substring(1);
        const ext = /(?:\.([^.]+))?$/.exec(hintId)[1];
        if (ext) {
            hintId = hintId.replace('.'.concat(ext), '');
        }
        const hint = config.results.model.hints.find(hint => hint.id === hintId);
        let file = vscode.Uri.file(hint.file);
        var content = fs.readFileSync(file.fsPath, 'utf8');
        return content;
    }
}
