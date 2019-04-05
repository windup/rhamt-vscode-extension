import * as vscode from 'vscode';
import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';
import * as sinon from 'sinon';
import { OptionsBuilder } from '../src/optionsBuilder';
import { ModelService } from '../src/model/modelService';
import { RhamtModel } from '../src/model/model';

const expect = chai.expect;
chai.use(sinonChai);

suite('RHAMT / Wizard', () => {
    let sandbox: sinon.SinonSandbox;
    let inputStub: sinon.SinonStub;
    const name = 'val';
    const modelService = new ModelService(new RhamtModel(), __dirname);

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
});
