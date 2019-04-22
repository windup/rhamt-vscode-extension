import { TreeItem, TreeItemCollapsibleState, Uri } from 'vscode';
import { ModelService } from '../model/modelService';

export class FileItem extends TreeItem {

    id: string = ModelService.generateUniqueId();
    collapsibleState: TreeItemCollapsibleState = TreeItemCollapsibleState.None;
    iconPath: string | Uri | { light: string | Uri; dark: string | Uri } | undefined;

    private file: string;

    constructor(file: string) {
        super(file);
        this.file = file;
        this.refresh();
    }

    public refresh(): void {
        this.label = this.file;
        this.collapsibleState = TreeItemCollapsibleState.Collapsed;
    }
}