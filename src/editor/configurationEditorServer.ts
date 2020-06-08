/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as express from 'express';
import * as path from 'path';
import * as bodyParser from 'body-parser';
import * as http from 'http';
import * as io from 'socket.io';
import { Endpoints } from '../model/model';
import { ConfigurationServerController } from './configurationServerController';
import { ClientConnectionService } from './clientConnectionService';

export class ConfigurationEditorServer {

    public app: express.Application;
    private server: http.Server;
    private socketListener: io.Server;
    private endpoints: Endpoints;
    private controller: ConfigurationServerController;
    private controllerService: ClientConnectionService;

    constructor(
            endpoints: Endpoints,
            controller: ConfigurationServerController,
            controllerService: ClientConnectionService) {
        this.endpoints = endpoints;
        this.controller = controller;
        this.controllerService = controllerService;
    }

    public start(): void {
        this.app = express();
        this.server = this.app.listen(this.endpoints.configurationPort());
        this.socketListener = io.listen(this.server);
        this.socketListener.sockets.on('connection', this.connectClient.bind(this));
        this.configServer();
        this.routes();
    }

    connectClient(s: io.Socket) {
        this.controllerService.connect(s);
    }

    private configServer() {
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.set('views', path.join(this.endpoints.configurationResourceRoot(), 'views'));
        this.app.set('view engine', 'jade');
        this.app.use(express.static(this.endpoints.configurationResourceRoot()));
        this.app.use(express.static(this.endpoints.resourcesRoot()));
        this.app.use(function(err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
            err.status = 404;
            next(err);
        });
    }

    private routes() {
        const router = express.Router();
        router.get('/:id', this.controller.get.bind(this.controller));
        router.get('/configuration/:id', this.controller.configuration.bind(this.controller));
        router.get('/rulesets/recent', this.controller.recentRulesets.bind(this.controller));
        this.app.use(router);
    }

    public dispose(): void {
        this.socketListener.close();
        this.server.close();
    }
  }
