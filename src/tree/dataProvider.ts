import { TreeDataProvider, Disposable, TreeItem } from 'vscode';
import { ITreeNode } from '.';
import { RhamtModelService } from 'raas-core';
import { localize } from './localize';
import { ConfigurationNode } from './configurationNode';

export class DataProvider implements TreeDataProvider<ITreeNode>, Disposable {

    private _disposables: Disposable[] = [];

    constructor(private modelService: RhamtModelService) {
    }

    public dispose(): void {
        for (const disposable of this._disposables) {
            disposable.dispose();
        }
    }

    public getTreeItem(node: ITreeNode): TreeItem {
        return node.treeItem;
    }

    public async getChildren(node?: ITreeNode): Promise<any[]> {
        try {
            return this.doGetChildren(node);
        } catch (error) {
            const item = new TreeItem(localize('errorNode', 'Error: {0}', error));
            item.contextValue = 'rhamtextensionui.error';
            return Promise.resolve([item]);
        }
    }

    private async doGetChildren(node?: ITreeNode): Promise<ITreeNode[]> {
        if (node) {
            return await node.getChildren();
        } else {
            return await this.populateRootNodes();
        }
    }


    private async populateRootNodes(): Promise<any[]> {
        return this.modelService.model.getConfigurations().map(config => {
            return new ConfigurationNode(
                config,
                this.modelService,
                this);
        });
    }
}