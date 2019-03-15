import * as assert from 'assert';
import { HintNode } from '../src/tree/hintNode';
import { RhamtModel, Hint } from '../src/model/model';
import { ModelService } from '../src/model/modelService';
import { RhamtTreeDataProvider } from '../src/tree/rhamtTreeDataProvider';

suite('RHAMT / Issue Explorer', () => {

    let modelService: ModelService;

    setup(() => {
        modelService = new ModelService(new RhamtModel());
    });

    test('model service', () => {
        const name = 'rhamtConfiguration';
        const config = modelService.createConfigurationWithName(name);
        assert.equal(config.name, name);
    });

    test('ananalysis results', async () => {
        const config = modelService.createConfigurationWithName('rhamtConfiguration');
        const hint: Hint = {
            text: 'text', file: 'file'
        };
        const dataProvider = new RhamtTreeDataProvider(modelService);
        dataProvider.load({
            config,
            getHints: () => [hint],
            getClassifications: () => []
        });
        const children = await dataProvider.getChildren();
        assert.equal(children.length, 1);
        assert.equal(children[0] instanceof HintNode, true);
    });
});
