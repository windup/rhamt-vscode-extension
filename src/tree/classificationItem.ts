import { TreeItem, Uri, TreeItemCollapsibleState, Command } from 'vscode';
import { ModelService } from '../model/modelService';
import { IClassification } from '../model/model';
import * as path from 'path';

export class ClassificationItem extends TreeItem {

    private _id: string = ModelService.generateUniqueId();
    collapsibleState: TreeItemCollapsibleState = TreeItemCollapsibleState.None;

    private classification: IClassification;

    constructor(classification: IClassification) {
        super(classification.description);
        this.classification = classification;
        this.refresh();
    }

    delete(): void {
    }

    public get iconPath(): string | Uri | { light: string | Uri; dark: string | Uri } | undefined {
        return {
            light: path.join(__dirname, '..', '..', '..', 'resources', 'light', 'error.svg'),
            dark: path.join(__dirname, '..', '..', '..', 'resources', 'light', 'error.svg')
        };
    }

    public get id(): string {
        return this._id;
    }

    public get tooltip(): string {
        return this.classification.description;
    }

    public get commandId(): string {
        return 'rhamt.openDoc';
    }

    public get command(): Command {
        return {
            command: 'rhamt.openDoc',
            title: '',
            arguments: [this.classification.file]
        };
    }

    public get contextValue(): string {
        return 'issue';
    }

    public refresh(): void {
        this.label = this.classification.description;
    }
}