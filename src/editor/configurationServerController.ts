/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Request, Response, NextFunction } from 'express';
import { ModelService } from '../model/modelService';
import { RhamtConfiguration } from '../model/model';

export class ConfigurationServerController {

    private modelService: ModelService;
    location: String;

    constructor(
        modelService: ModelService) {
        this.modelService = modelService;
    }

    get(req: Request, res: Response, next: NextFunction): void {
        const config = this.modelService.getConfiguration(req.params.id);
        if (config) {
            if (!this.location.endsWith('/')) {
                this.location = `${location}/`;
            }
            res.render(
                'index',
                {
                    configId: JSON.stringify(config.id),
                    elementData: JSON.stringify(this.modelService.elementData),
                    base: this.location
                }
            );
        }
        else {
            ConfigurationServerController.configurationNotFound(req, res);
        }
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
