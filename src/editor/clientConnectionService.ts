/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as io from 'socket.io';
import { ModelService } from '../model/modelService';
import { ConfigurationClientManager } from './configurationClientManager';
import { ConfigurationClient } from './configurationClient';
import * as vscode from 'vscode';

export class ClientConnectionService {

    private clientManagers: Map<string, ConfigurationClientManager> = new Map<string, ConfigurationClientManager>();
    private modelService: ModelService;
    private clientIdSeq: number = 0;

    constructor(modelService: ModelService) {
        this.modelService = modelService;
        this.registerThemeChangedListener();
    }

    connect(s: io.Socket): void {
        const id = s.handshake.query.id;
        const config = this.modelService.getConfiguration(id);
        console.log(`client socket connection: ${id}`);
        if (config) {
            console.log('creating client');
            const clientId = String(this.clientIdSeq++);
            const client = new ConfigurationClient(s, clientId);
            let manager = this.clientManagers.get(id);
            if (!manager) {
                console.log('creating client manager');
                manager = new ConfigurationClientManager(config, this.modelService);
                this.clientManagers.set(id, manager);
            }
            else {
                console.log('client manager already exists');
            }
            client.onDisposed.on(() => {
                console.log(`client disposed...`);
                this.clientManagers.delete(id);
                manager.disconnectClient(client);
            });
            manager.connectClient(client);
        }
    }


    private registerThemeChangedListener() {
        vscode.window.onDidChangeActiveColorTheme((theme: vscode.ColorTheme) => {
            const newTheme = theme.kind === vscode.ColorThemeKind.Light ? 'light' : 'dark';
            this.clientManagers.forEach((clientManager) => {
                clientManager.notifyThemeChanged(newTheme);
            });
        }); 
    }
}
