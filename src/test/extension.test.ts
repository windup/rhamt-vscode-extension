import { RhamtModel, RhamtModelService, IHint } from 'raas-core';
import * as assert from 'assert';
import { DataProvider } from '../tree/DataProvider';
import { HintNode } from '../tree/hintNode';

suite("RHAMT Tests", function () {

    test("Analysis Results :: Issue Explorer :: Hints", async function() {
        const modelService = new RhamtModelService(new RhamtModel(), '');
        const config = modelService.createConfiguration();
        const hint: IHint = {
            id: RhamtModelService.generateUniqueId(),
            quickfixes: [],
            file: '',
            severity: '',
            ruleId: '',
            effort: '',
            title: '',
            messageOrDescription: '',
            links: [],
            report: '',
            originalLineSource: '',
            lineNumber: 0,
            column: 0,
            length: 0,
            sourceSnippet: ''
        };
        const results: any = { 
            getHints: () => [hint],
            getClassifications: () => []
        };
        config.results = results;
        const dataProvider = new DataProvider(modelService);
        const children = await dataProvider.getChildren();
        assert.equal(children.length, 1);
        const parent = children[0];
        const nodes = await parent.getChildren();
        assert.equal(nodes.length, 1);
        assert.equal(nodes[0] instanceof HintNode, true);
    });
});
