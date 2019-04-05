import * as assert from 'assert';
import { RhamtModel } from '../src/model/model';
import { ModelService } from '../src/model/modelService';

suite('RHAMT / Issue Explorer', () => {

    let modelService: ModelService;

    setup(() => {
        modelService = new ModelService(new RhamtModel(), __dirname);
    });

    test('model service', () => {
        const name = 'rhamtConfiguration';
        const config = modelService.createConfigurationWithName(name);
        assert.equal(config.name, name);
    });
});
