
import * as vscode from "vscode";
import { Utils } from "./Utils";
import {  } from 'rhamt-client';

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
        let cli = Utils.getRhamtExecutable();
        console.log('Using rhamt-cli at: ' + cli);

    }
}
