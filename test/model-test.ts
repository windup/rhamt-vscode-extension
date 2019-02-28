
import { expect } from 'chai';
import { ModelService } from '../src/model/modelService'
import { RhamtModel } from '../src/model/model';

describe('Model', () => {
    it('ModelService :: Instantiation', () => {
        const modelService = new ModelService(new RhamtModel());
        const name = 'rhamtConfiguration';
        const config = modelService.createConfigurationWithName(name);
        expect(config.options.get('name')).to.equal(name);
    });
});
