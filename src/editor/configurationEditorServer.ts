/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as express from 'express';
import * as path from 'path';
import * as bodyParser from 'body-parser';
import * as http from 'http';
import * as io from 'socket.io';
const request = require('request');
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

    public start(): Promise<void> {
        this.endpoints.isReady = false;
        return this.endpoints.ready = new Promise<void> (async (resolve, reject) => {
            this.app = express();
            let location = await this.endpoints.configurationLocation();
            console.log(`location: ${location}`);
            this.controller.location = location;
            this.server = this.app.listen(this.endpoints.configurationPort());
            let cancelled = false;
            const doResolve = (() => {
                console.log(`Configuration server startup verified. Notifying...`);
                this.endpoints.isReady = true;
                resolve();
            }).bind(this);
            const startTimer = (() => {
                setTimeout(() => {
                    console.log(`Configuration server start timeout. Checking for started...`);
                    if (!this.endpoints.isReady) {
                        cancelled = true;
                        console.log(`Configuration server startup timeout failure. Notifying...`);
                        reject();
                    }
                }, 25000);
            }).bind(this);
            this.server.on('listening', () => {
                console.log(`Configuration server successfully started...`);
                startTimer();
                (function poll() {
                    request(location+'ping/check', (err, res, body) => {
                        if (res && res.statusCode === 200){
                            doResolve();
                        }
                        else if (!cancelled) {
                            try {
                                console.log('Configuration server not available. Trying again...');
                                poll();
                            }
                            catch (e) {
                                console.log(`Error polling configuration server: ${e}`);
                            }
                        }
                    });
                })();
            });
            this.server.on('error', e => console.log(`Configuration server error: ${e}`));
            this.socketListener = io.listen(this.server);
            this.socketListener.sockets.on('connection', this.connectClient.bind(this));
            this.configServer();
            this.routes();
        });
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
        router.get('/ping/check', (req: any, res: express.Response, next: any) => {
            res.status(200).json({});
        });
        this.app.use(router);
    }

    public dispose(): void {
        this.socketListener.close();
        this.server.close();
    }
  }
