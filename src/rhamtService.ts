'use strict';

import * as vscode from "vscode";
import { Utils } from "./Utils";
import { RhamtClient, RhamtConfiguration } from 'rhamt-client';

export class RhamtService {

    private rhamtClient: RhamtClient;

    constructor () {
        this.rhamtClient = new RhamtClient();
    }

    public async startServer() {
        if (await Utils.checkRhamtAvailablility()) {
            Utils
            Utils.findJavaHome().then(javaHome => {
                vscode.window.showInformationMessage('Starting RHAMT server...');
                console.log('attempting to start the rhamt-client');
                let executable = Utils.getRhamtExecutable();
                let config = new RhamtConfiguration(executable, javaHome);
                this.rhamtClient.start(config);
            }).catch((error) => {
                console.log('Java Home could not be resolved: ' + error);
            });
        }
    }

    public stopServer() {
        vscode.window.showInformationMessage('Stopping RHAMT server ...');
        console.log('attempting to stop the rhamt-client');
        this.rhamtClient.stop();
    }

    public isRunning() : boolean {
        return this.rhamtClient.isRunning();
    }

    public analyzeWorkspace() {
        if (vscode.workspace.workspaceFolders) {
            let locations = vscode.workspace.workspaceFolders.map(folder => folder.uri.fsPath);
            this.analyze(locations);
        }
    }

    public analyze(input: string[]) {
        console.log('attempting to start rhamt-client analysis');
        console.log('input: ' + input);
        let cli = Utils.getRhamtExecutable();
        console.log('rhamt-cli: ' + cli);
        //let config = new RhamtConfiguration(Utils.getRhamtExecutable(), Utils.getJavaHome());
    }
}
