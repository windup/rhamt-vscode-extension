import { TreeItem, TreeItemCollapsibleState, Uri } from 'vscode';
import { ModelService } from '../model/modelService';

export class HintsItem extends TreeItem {

    id: string = ModelService.generateUniqueId();
    collapsibleState: TreeItemCollapsibleState = TreeItemCollapsibleState.None;
    iconPath: string | Uri | { light: string | Uri; dark: string | Uri } | undefined;

    constructor(file: string) {
        super(file);
    }

    public refresh(count: number): void {
        this.label = `Hints (${count})`;
        this.collapsibleState = TreeItemCollapsibleState.Collapsed;
    }
}