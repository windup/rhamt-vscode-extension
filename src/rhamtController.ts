'use strict';

import * as vscode from "vscode";
import { window, ProgressLocation } from 'vscode';
import { Utils } from "./Utils";
import { RhamtClient } from "./rhamtService/rhamtClient";
import { RhamtConfiguration } from "raas-core";

export class RhamtController {

    private config: RhamtConfiguration;
    private rhamtClient: RhamtClient;

    constructor(config: RhamtConfiguration) {
        this.config = config;
        this.rhamtClient = new RhamtClient(this.config);
    }

    public async startServer() {
        return Utils.initConfiguration(this.config).then(() => {
            window.withProgress(
                { location: ProgressLocation.Window, cancellable: false },
                async progress => {
                progress.report({message: 'Starting analysis engine'});
                var p = new Promise(resolve  => {
                    this.rhamtClient.start().then(() => {
                        progress.report({message: 'Started'});
                        resolve();
                    });
                });
                return p;
            });
        });
    }

    public stopServer() {
        if (this.rhamtClient) {
            window.withProgress({
                location: ProgressLocation.Notification,
                title: "Stopping analysis engine",
                cancellable: true}, (progress) => {
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

    public analyze() {
        this.startServer();
        this.rhamtClient.analyze();
        this.startProgress();
    }

    private startProgress(): void {
        let options = {
            location: ProgressLocation.Window,
            cancellable: true
        };
        window.withProgress(options, progress => {
            progress.report({message: 'Preparing analysis configuration...'});
            return Promise.resolve();
        });
    }
}
