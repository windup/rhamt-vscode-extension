import { AbstractNode, ITreeNode } from './abstractNode';
import { RhamtConfiguration } from '../model/model';
import { ModelService } from '../model/modelService';
import { ConfigurationElement } from './configurationElement';
import { RhamtTreeDataProvider } from './rhamtTreeDataProvider';

export class ConfigurationTreeNode extends AbstractNode<ConfigurationElement> {

    constructor(
        config: RhamtConfiguration,
        modelService: ModelService,
        dataProvider: RhamtTreeDataProvider) {
        super(config, modelService, dataProvider);
        this.treeItem = this.createItem();
    }

    createItem(): ConfigurationElement {
        const item = new ConfigurationElement(this.config);
        return item;
    }

    delete(): Promise<void> {
        return Promise.resolve();
    }

    protected refresh(): void {
        this.treeItem.refresh();
    }

    getChildren(): Promise<ITreeNode[]> {
        return Promise.resolve([]);
    }
}
