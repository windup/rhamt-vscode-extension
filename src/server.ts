
import * as vscode from "vscode";

export class Server {

    public static start() {

    }

    public static stop() {

    }

    public static isRunning() : boolean {
        return false;
    }

    public static analyzeWorkspace() {
        if (vscode.workspace.workspaceFolders) {
            let locations = vscode.workspace.workspaceFolders.map(folder => folder.uri.fsPath);
            this.analyze(locations);
        }
    }

    public static analyze(input: string[]) {
        console.log('RHAMT analyzing input: ' + input);
    }
}
