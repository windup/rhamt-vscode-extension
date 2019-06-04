/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as express from 'express';
import * as path from 'path';
import * as http from 'http';
import * as serveStatic from 'serve-static';
import { ReportEndpoints } from '../model/model';
import { Disposable } from 'vscode';

export class ReportServer implements Disposable {

    public app: express.Application;
    private server: http.Server;
    private endpoints: ReportEndpoints;

    constructor(endpoints: ReportEndpoints) {
        this.endpoints = endpoints;
    }

    public start(): void {
        this.app = express();
        this.server = this.app.listen(this.endpoints.port());
        this.configServer();
    }

    private configServer() {
        this.app.use(serveStatic(path.join(this.endpoints.reportsRoot())));
        this.app.use(function(err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
            err.status = 404;
            next(err);
        });
    }

    public dispose(): void {
        this.server.close();
    }
  }