/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { RhamtConfiguration, RhamtModel } from '../src/model/model';
import { ModelService } from '../src/model/modelService';

suite('RHAMT / Model', () => {

    let modelService: ModelService;
    const outDir = __dirname;
    const outputLocation = __dirname;

    setup(() => {
        modelService = new ModelService(new RhamtModel(), outDir, outputLocation, getReportEndpoints(__dirname));
    });

    test('configuration name', () => {
        const name = 'mtaConfiguration';
        const config = modelService.createConfigurationWithName(name);
        assert.equal(config.name, name);
    });

    function getReportEndpoints(out: string): any {
        return {
            port: () => {
                return process.env.RAAS_PORT || String(61435);
            },
            host: () => {
                return 'localhost';
            },
            location: () => {
                return `http://${this.host()}:${this.port()}`;
            },
            resourcesRoot: () => {
                return vscode.Uri.file(path.join(out, 'out'));
            },
            reportsRoot: () => {
                return out;
            }
        };
    }

    test('add configuration', () => {
        const config = new RhamtConfiguration();
        modelService.addConfiguration(config);
        assert.ok(modelService.model.configurations.length == 1);
    });

    test('delete configuration', () => {
        modelService.model.configurations = [];
        const config = new RhamtConfiguration();
        modelService.addConfiguration(config);
        assert.ok(modelService.model.configurations.length == 1);
        modelService.deleteConfiguration(config);
        assert.ok(modelService.model.configurations.length == 0);
    });

    test('configuration output path', () => {
        const config = modelService.createConfiguration();
        assert.equal(config.options['output'], path.resolve(outDir, config.id));
    });
});
