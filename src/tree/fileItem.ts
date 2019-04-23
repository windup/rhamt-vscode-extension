import { TreeItem, TreeItemCollapsibleState, Uri, workspace } from 'vscode';
import { ModelService } from '../model/modelService';
import * as path from 'path';

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
        let label = this.file;
        const root = workspace.getWorkspaceFolder(Uri.file(this.file));
        if (!root) {
            label = path.relative(root.uri.fsPath, this.file);
        }
        this.label = label;
        this.collapsibleState = TreeItemCollapsibleState.Collapsed;
    }
}