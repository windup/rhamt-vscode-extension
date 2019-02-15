import { RhamtConfiguration, RhamtModelService, IClassification, IHint } from 'raas-core';
import { ConfigurationItem } from './configurationItem';
import { ITreeNode } from '.';
import { AbstractNode } from './abstractNode';
import { ClassificationNode } from './classificationNode';
import { DataProvider } from './dataProvider';
import { HintNode } from './hintNode';

export class ConfigurationNode extends AbstractNode<ConfigurationItem> {

    constructor(
        config: RhamtConfiguration,
        modelService: RhamtModelService,
        dataProvider: DataProvider) {
        super(config, modelService, dataProvider);
        this.treeItem = this.createItem();
        this.listen();
    }

    createItem(): ConfigurationItem {
        const item = new ConfigurationItem(this.config);
        return item;
    }

    delete(): Promise<void> {
        return Promise.resolve();
    }

    public getChildren(): Promise<ITreeNode[]> {
        return new Promise<ITreeNode[]>(resolve => {
            const children: ITreeNode[] = [];
            if (this.config.results) {
                this.config.results.getClassifications().forEach(classification => {
                    const node: ITreeNode = this.createClassificationNode(classification);
                    children.push(node);
                });
                this.config.results.getHints().forEach(hint => {
                    const node: ITreeNode = this.createHintNode(hint);
                    children.push(node);
                });
            }
            resolve(children);
        });
    }

    public hasMoreChildren(): boolean {
        if (this.config.results) {
            const classificiations = this.config.results.getClassifications();
            if (classificiations.length > 0) {
                return true;
            }
            const hints = this.config.results.getHints();
            if (hints.length > 0) {
                return true;
            }
        }
        return false;
    }

    createClassificationNode(classification: IClassification): ITreeNode {
        const node: ITreeNode = new ClassificationNode(
            classification,
            this.config,
            this.modelService,
            this.dataProvider);
        return node;
    }

    createHintNode(hint: IHint): ITreeNode {
        const node: ITreeNode = new HintNode(
            hint,
            this.config,
            this.modelService,
            this.dataProvider);
        return node;
    }

    private listen(): void {
        this.config.onResultsLoaded.on(() => {
            this.refresh();
        });
    }

    protected refresh(): void {
        this.treeItem.refresh();
    }
}
