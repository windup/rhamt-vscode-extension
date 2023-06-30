/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { RhamtModel } from '../src/model/model';
import { ModelService } from '../src/model/modelService';

suite('RHAMT / Issue Explorer', () => {

    let modelService: ModelService;

    setup(() => {
        modelService = new ModelService(new RhamtModel(), __dirname, getReportEndpoints(__dirname));
    });

    test('model service', () => {
        const name = 'configuration';
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
});
