'use strict';

import * as vscode from "vscode";
import { window, ProgressLocation } from 'vscode';
import { Utils } from "./Utils";
import { RhamtClient } from "./rhamtService/rhamtClient";
import { ServerConfiguration, RunConfiguration } from "./rhamtService/main";
import { ProgressMonitor } from "./progressMonitor";

export class RhamtService {

    private rhamtClient?: RhamtClient;

    public async startServer() {
        Utils.createConfiguration()
            .then(config => {
                this.rhamtClient = new RhamtClient(config);
                this.initServerListeners(config);
                this.rhamtClient.start().then(() => {
                    console.log('vscode started the rhamt server!!!');
                    vscode.window.showInformationMessage('Analysis engine started');
                })
                .catch(() => {
                    console.log('vscode error while starting server.');
                    vscode.window.showErrorMessage('Failed to start analysis engine');
                });
            })
            .catch(() => {
                console.log('unable to create run configuration.');
            });
    }

    private initServerListeners(config: ServerConfiguration): void {
        config.stoppedCallback = () => {
            vscode.window.showInformationMessage('analysis engine stopped');
        };
        config.timeoutCallback = () => {
            vscode.window.showErrorMessage('analysis engine start timeout');
        };
    }

    public stopServer() {
        console.log('attempting to stop the rhamt-client');
        if (this.rhamtClient && this.rhamtClient.isRunning()) {
            window.withProgress({
                location: ProgressLocation.Notification,
                title: "Stopping analysis engine",
                cancellable: true
            }, (progress, token) => {
                console.log('vscode rhamt-client server is running. attempting to terminate...');
                return new Promise((resolve, reject) => {
                    this.rhamtClient!.stop()
                    .then(() => {
                        progress.report({ increment: 100, message: 'stopped' });
                        resolve();
                    })
                    .catch(err => { 
                        reject();
                        vscode.window.showErrorMessage(err);
                    });
                });
            });
        }
        else {
            vscode.window.showInformationMessage('Analysis engine not running');
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

        window.withProgress({
			location: ProgressLocation.Notification,
			title: "Analyzing",
			cancellable: true
		}, (progress, token) => {

			token.onCancellationRequested(() => {
				console.log("User canceled the analysis.");
            });
            
			const p = new Promise(resolve => {

                const config = new RunConfiguration('mytester', 
                    new ProgressMonitor(() => setTimeout(() => resolve(), 3000), progress));

                this.rhamtClient!.analyze(config)
                .then(() => {
                    progress.report({ message: 'analysis has began' });
                })
                .catch((err) => {
                    console.log('vscode cannot run analysis: ' + err);
                });
            });
            
            return p;
        });
    }
}
