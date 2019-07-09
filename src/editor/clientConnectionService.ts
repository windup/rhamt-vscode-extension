import * as io from 'socket.io';
import { ModelService } from '../model/modelService';
import { ConfigurationClientManager } from './configurationClientManager';
import { ConfigurationClient } from './configurationClient';

export class ClientConnectionService {

    private clientManagers: Map<string, ConfigurationClientManager> = new Map<string, ConfigurationClientManager>();
    private modelService: ModelService;
    private clientIdSeq: number = 0;

    constructor(modelService: ModelService) {
        this.modelService = modelService;
    }

    connect(s: io.Socket): void {
        const id = s.handshake.query.id;
        const config = this.modelService.getConfiguration(id);
        if (config) {
            const clientId = String(this.clientIdSeq++);
            const client = new ConfigurationClient(s, clientId);
            let manager = this.clientManagers.get(id);
            if (!manager) {
                manager = new ConfigurationClientManager(config);
                this.clientManagers.set(id, manager);
            }
            client.onDisposed.on(() => {
                console.log(`client socket disconnected. disconnecting client from config client manager??`);
            });
            manager.connectClient(client);
        }
    }
}
