import { TreeItem, Uri, TreeItemCollapsibleState, Command } from 'vscode';
import { ModelService } from '../model/modelService';
import { RhamtConfiguration, IClassification } from '../model/model';
import * as path from 'path';

export class ClassificationItem extends TreeItem {

    private _id: string = ModelService.generateUniqueId();
    collapsibleState: TreeItemCollapsibleState = TreeItemCollapsibleState.None;

    private config: RhamtConfiguration;
    private classification: IClassification;

    constructor(config: RhamtConfiguration, classification: IClassification) {
        super(config.options['name']);
        this.config = config;
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
        this.label = this.classification.title;
    }
}