import { AbstractNode, ITreeNode } from './abstractNode';
import { ClassificationItem } from './classificationItem';
import { Classification, RhamtConfiguration } from '../model/model';
import { ModelService } from '../model/modelService';
import { RhamtTreeDataProvider } from './rhamtTreeDataProvider';

export class ClassificationNode extends AbstractNode {

    private classification: Classification;

    constructor(
        classification: Classification,
        config: RhamtConfiguration,
        modelService: ModelService,
        dataProvider: RhamtTreeDataProvider) {
        super(config, modelService, dataProvider);
        this.classification = classification;
        this.treeItem = this.createItem();
    }

    getChildren(): Promise<ITreeNode[]> {
        return Promise.resolve([]);
    }

    delete(): Promise<void> {
        return Promise.resolve();
    }

    createItem(): ClassificationItem {
        const item = new ClassificationItem(this.classification);
        return item;
    }
}