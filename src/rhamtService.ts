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

                let options = {
                    location: ProgressLocation.Window,
                    cancellable: false
                };
        
                window.withProgress(options, async (progress, token) => {
        
                    token.onCancellationRequested(() => {
                        console.log('cancelled');
                    });

                    progress.report({message: 'Starting analysis engine'});
                            
                    this.initServerListeners(config);
                    
                    var p = new Promise(resolve  => {
                        this.rhamtClient!.start().then(() => {
                            progress.report({message: 'Started'});
                            setTimeout(() => { 
                                resolve();
                            }, 1500);
                            
                        });
                    });
                    return p;
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
        if (vscode.workspace.workspaceFolders) {
            let locations = vscode.workspace.workspaceFolders.map(folder => folder.uri.fsPath);
            this.analyze(locations);
        }
    }

    public analyze(input: string[]) {
        console.log('attempting to start rhamt-client analysis');
        console.log('input: ' + input);

        let source = input[0];
        let out = source + '/rhamt';

        const config = new RunConfiguration('mytester', source, out);

        this.rhamtClient!.analyze(config).then(() => {
            this.startProgress(config);
        })
        .catch(() => vscode.window.showInformationMessage('Unable to prepare analysis configuration'));
    }

    private startProgress(config: RunConfiguration): void {

        let options = {
            location: ProgressLocation.Window,
            cancellable: true
        };

        window.withProgress(options, (progress, token) => {

            token.onCancellationRequested(() => {
                console.log('cancelled');
            });
            
            progress.report({message: 'Preparing analysis configuration...'});

            var p = new Promise<any>((resolve, reject) => {
                let monitor = new ProgressMonitor(progress, () => resolve());
                config.handleMessage = monitor.handleMessage.bind(monitor);
            });

            return p;
        });
    }
}
