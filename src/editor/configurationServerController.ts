/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import { ModelService } from '../model/modelService';
import { RhamtConfiguration, Endpoints } from '../model/model';
import * as path from 'path';

export class ConfigurationServerController {

    private modelService: ModelService;
    private endpoints: Endpoints;
    private elementData: any;

    constructor(
        modelService: ModelService,
        endpoints: Endpoints) {
        this.modelService = modelService;
        this.endpoints = endpoints;
        this.readElementData();
    }

    private async readElementData(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            if (this.elementData) resolve(this.elementData);
            else {
                fs.readFile(path.join(this.endpoints.resourcesRoot(), 'help.json'), (err, data: any) => {
                    if (err) reject(err);
                    else resolve(this.elementData = JSON.parse(data));
                });
            }
        }).catch(err => {
            console.log(`ConfigurationServerController :: Error reading help.json :: ${err}`);
        });
    }

    get(req: Request, res: Response, next: NextFunction): void {
        this.readElementData().then(data => {
            const config = this.modelService.getConfiguration(req.params.id);
            if (config) {
                res.render('index', {configId: JSON.stringify(config.id), elementData: JSON.stringify(data)});
            }
            else {
                ConfigurationServerController.configurationNotFound(req, res);
            }
        });
    }

    configuration(req: Request, res: Response, next: NextFunction): void {
        this.findConfiguration(req, res).then(result => {
            const config = {
                id: result.id,
                name: result.name,
                options: result.options
            };
            res.status(200).json({config});
        });
    }

    recentRulesets(req: Request, res: Response, next: NextFunction): void {
        res.status(200).json(this.modelService.getRulesets());
    }

    private findConfiguration(req: Request, res: Response): Promise<RhamtConfiguration> {
        return new Promise<RhamtConfiguration>(resolve => {
            const config = this.modelService.getConfiguration(req.params.id);
            if (config) {
                resolve(config);
            }
            else {
                ConfigurationServerController.configurationNotFound(req, res);
            }
        });
    }

    private static configurationNotFound(req: Request, res: Response): void {
        res.status(500).json(`Cannot find configuration: ${req.params.id}`);
    }
}
