/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as express from 'express';
import * as http from 'http';
import { Endpoints } from '../model/model';

export class ReportServer {

    public app: express.Application;
    private server: http.Server;
    private endpoints: Endpoints;

    constructor(endpoints: Endpoints) {
        this.endpoints = endpoints;
    }

    public start(): void {
        this.app = express();
        this.server = this.app.listen(this.endpoints.reportPort());
        this.configServer();
    }

    private configServer() {
        this.app.use(function(err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
            err.status = 404;
            next(err);
        });
    }

    public dispose(): void {
        this.server.close();
    }
  }