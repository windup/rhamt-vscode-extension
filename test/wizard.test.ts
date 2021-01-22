/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';
import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';
import * as sinon from 'sinon';
import * as path from 'path';
import { OptionsBuilder } from '../src/optionsBuilder';
import { ModelService } from '../src/model/modelService';
import { RhamtModel } from '../src/model/model';

const expect = chai.expect;
chai.use(sinonChai);

suite('RHAMT / Wizard', () => {
    let sandbox: sinon.SinonSandbox;
    let inputStub: sinon.SinonStub;
    const name = 'val';
    const modelService = new ModelService(new RhamtModel(), __dirname, __dirname, getReportEndpoints(__dirname));

    setup(() => {
        sandbox = sinon.createSandbox();
        inputStub = sandbox.stub(vscode.window, 'showInputBox');
    });

    teardown(() => {
        sandbox.restore();
    });

    suite('create configuration', () => {
        suite('validation', () => {
            setup(() => {
                inputStub.restore();
            });
            test('valid configuration name', async () => {
                let result: string | Thenable<string>;
                inputStub = sandbox.stub(vscode.window, 'showInputBox').onFirstCall().callsFake(
                    (options?: vscode.InputBoxOptions, token?: vscode.CancellationToken): Thenable<string> => {
                        result = options.validateInput(name);
                        return Promise.resolve(name);
                    }
                );
                OptionsBuilder.build(modelService);
                expect(result).is.undefined;
            });
            test('empty configuration name', async () => {
                let result: string | Thenable<string>;
                inputStub = sandbox.stub(vscode.window, 'showInputBox').onFirstCall().callsFake(
                    (options?: vscode.InputBoxOptions, token?: vscode.CancellationToken): Thenable<string> => {
                        result = options.validateInput('');
                        return Promise.resolve('');
                    }
                );
                OptionsBuilder.build(modelService);
                expect(result).is.equals('Configuration name required');
            });
        });
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
