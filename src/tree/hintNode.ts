import { AbstractNode } from './abstractNode';
import { RhamtConfiguration, RhamtModelService, IHint } from 'raas-core';
import { ITreeNode } from '.';
import { DataProvider } from './dataProvider';
import { HintItem } from './hintItem';

export class HintNode extends AbstractNode {

    private hint: IHint;

    constructor(
        hint: IHint,
        config: RhamtConfiguration,
        modelService: RhamtModelService,
        dataProvider: DataProvider) {
        super(config, modelService, dataProvider);
        this.hint = hint;
        this.treeItem = this.createItem();
    }

    getChildren(): Promise<ITreeNode[]> {
        return Promise.resolve([]);
    }

    delete(): Promise<void> {
        return Promise.resolve();
    }

    createItem(): HintItem {
        const item = new HintItem(this.config, this.hint);
        return item;
    }
}