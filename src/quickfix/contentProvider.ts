import * as vscode from "vscode";
import { ModelService } from "../model/modelService";
import * as fs from 'fs';

export class QuickfixContentProvider implements vscode.TextDocumentContentProvider {

    constructor(private modelService: ModelService) {
    }
    
    async provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): Promise<string> { 
        const config = this.modelService.getConfiguration(uri.authority);
        const hints = await config.results.getHints();
        let hintId = uri.path.substring(1);
        var ext = /(?:\.([^.]+))?$/.exec(hintId)[1];
        if (ext) {
            hintId = hintId.replace('.'.concat(ext), '');
        }
        const hint = hints.find(hint => hint.id === hintId);
        let file = vscode.Uri.file(hint.file);
        var content = fs.readFileSync(file.fsPath, 'utf8');
        return content;
    }
}