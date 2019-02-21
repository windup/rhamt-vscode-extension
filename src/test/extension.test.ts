import * as assert from 'assert';
import { HintNode } from '../tree/hintNode';
import { RhamtModel, Hint } from '../model/model';
import { ModelService } from '../model/modelService';
import { RhamtTreeDataProvider } from '../tree/rhamtTreeDataProvider';

suite("RHAMT Tests", function () {

    test("Analysis Results :: Issue Explorer :: Hints", async function() {
        const modelService = new ModelService(new RhamtModel());
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
