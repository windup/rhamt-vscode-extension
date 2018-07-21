'use strict';

import * as vscode from "vscode";
import { Utils } from "./Utils";
import { RhamtClient } from "./rhamtService/rhamtClient";
import { ServerConfiguration, RunConfiguration } from "./rhamtService/main";

export class RhamtService {

    private rhamtClient?: RhamtClient;

    public async startServer() {
        Utils.createConfiguration()
            .then(config => {
                vscode.window.showInformationMessage('config is: ' + JSON.stringify(config));
                this.rhamtClient = new RhamtClient(config);
                this.initServerListeners(config);
                this.rhamtClient.start().then(() => {
                    console.log('vscode started the rhamt server!!!');
                })
                .catch(() => {
                    console.log('vscode error while starting server.');
                });
            })
            .catch(() => {
                console.log('unable to create run configuration.');
            });

        //let javaHome: string = await Utils.getJavaHome();
        //console.log('Using JAVA_HOME: ' + javaHome);
        /*if (await Utils.checkRhamtAvailablility()) {
            Utils
            Utils.findJavaHome().then(javaHome => {
                vscode.window.showInformationMessage('Starting RHAMT server...');
                console.log('attempting to start the rhamt-client');
                let executable = Utils.getRhamtExecutable();
                let serverMonitor = new ServerMonitor();
                let config = new RhamtRunConfiguration(executable, 8080, javaHome, serverMonitor);
                this.rhamtClient.start(config).then(() => {
                    console.log('rhamtService: rhamt-client started.');
                }).catch((error) => {
                    console.log('rhamt-client error: ' + error);
                });
            }).catch((error) => {
                console.log('Java Home could not be resolved: ' + error);
            });
        }
        */
    }

    private initServerListeners(config: ServerConfiguration): void {
        config.startedCallback = () => {};
        config.stoppedCallback = () => {
            console.log("WEEERE ROLLING!!!!");
        };
        config.timeoutCallback = () => {};
    }

    public stopServer() {
        vscode.window.showInformationMessage('Stopping RHAMT server ...');
        console.log('attempting to stop the rhamt-client');
        if (this.rhamtClient!.isRunning()) {
            console.log('vscode rhamt-client server is running. attempting to terminate...');
            this.rhamtClient!.stop();
        }
    }

    public isRunning() : boolean {
        return this.rhamtClient!.isRunning();
    }

    public analyzeWorkspace() {
       // if (vscode.workspace.workspaceFolders) {
           // let locations = vscode.workspace.workspaceFolders.map(folder => folder.uri.fsPath);
            this.analyze([]);
        //}
    }

    public analyze(input: string[]) {
        console.log('attempting to start rhamt-client analysis');
        console.log('input: ' + input);
        this.rhamtClient!.analyze(new RunConfiguration('mytester'))
            .then(() => {
                console.log('###ANALYZING!!!!');
            })
            .catch((err) => {
                console.log('vscode cannot run analysis: ' + err);
            });
        console.log('sent the analyze request...');
        //let cli = Utils.getRhamtExecutable();
        //console.log('rhamt-cli: ' + cli);
        //let config = new RhamtConfiguration(Utils.getRhamtExecutable(), Utils.getJavaHome());
    }
}
