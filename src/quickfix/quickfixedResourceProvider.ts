/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from "vscode";
import { ModelService } from '../model/modelService';
import * as fs from 'fs-extra';

export class QuickfixedResourceProvider implements vscode.TextDocumentContentProvider {

    constructor(private modelService: ModelService) {
    }

    async provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): Promise<string> {
        const config = this.modelService.getConfiguration(uri.authority);
        const hints = await config.results.getHints();
        let hintId = uri.path.substring(1);
        const ext = /(?:\.([^.]+))?$/.exec(hintId)[1];
        if (ext) {
            hintId = hintId.replace('.'.concat(ext), '');
        }
        const issue = hints.find(hint => hint.id === hintId);
        return fs.readFileSync(issue.file, 'utf8');
    }
}
