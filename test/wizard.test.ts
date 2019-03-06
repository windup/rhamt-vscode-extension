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
    const modelService = new ModelService(new RhamtModel());

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
            test('returns undefinded for valid configuration name', async () => {
                let result: string | Thenable<string>;
                inputStub = sandbox.stub(vscode.window, 'showInputBox').onFirstCall().callsFake((options?: vscode.InputBoxOptions, token?: vscode.CancellationToken): Thenable<string> => {
                    result = options.validateInput('val');
                    return Promise.resolve('val');
                });

                OptionsBuilder.build(modelService);

                expect(result).is.undefined;
            });
            test('returns error message for empty configuration name', async () => {
                let result: string | Thenable<string>;
                inputStub = sandbox.stub(vscode.window, 'showInputBox').onFirstCall().callsFake((options?: vscode.InputBoxOptions, token?: vscode.CancellationToken): Thenable<string> => {
                    result = options.validateInput('');
                    return Promise.resolve('');
                });
                OptionsBuilder.build(modelService);
                expect(result).is.equals('Configuration name required');
            });
        });
    });
});