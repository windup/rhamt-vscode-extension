'use strict';

import * as vscode from "vscode";
import { window, ProgressLocation } from 'vscode';
import { Utils } from "./Utils";
import { RhamtClient } from "./rhamtService/rhamtClient";
import { RhamtConfiguration } from "raas-core";

export class RhamtService {

    private rhamtClient?: RhamtClient;

    constructor() {
    }

    public async startServer(config: RhamtConfiguration) {

        Utils.initConfiguration(config).then(() => {
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

    public analyzeWorkspace(config: RhamtConfiguration) {
        if (vscode.workspace.workspaceFolders) {
            let locations = vscode.workspace.workspaceFolders.map(folder => folder.uri.fsPath);
            this.analyze(config, locations);
        }
    }

    public analyze(config: RhamtConfiguration, input: string[]) {
        config.options['input'] = input;
        config.options['output'] = input[0] + '/../rhamt';

        this.rhamtClient!.analyze().then(() => {
            this.startProgress(config);
        })
        .catch(() => vscode.window.showInformationMessage('Unable to prepare analysis configuration'));
    }

    private startProgress(config: RhamtConfiguration): void {

        let options = {
            location: ProgressLocation.Window,
            cancellable: true
        };

        window.withProgress(options, (progress, token) => {

            token.onCancellationRequested(() => {
                console.log('cancelled');
            });
            
            progress.report({message: 'Preparing analysis configuration...'});

            return Promise.resolve();
        });
    }
}
