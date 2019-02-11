import { TreeItem, Uri, TreeItemCollapsibleState, Command } from 'vscode';
import { RhamtModelService, RhamtConfiguration, IClassification } from 'raas-core';

export class ClassificationItem extends TreeItem {

    private _id: string = RhamtModelService.generateUniqueId();
    collapsibleState: TreeItemCollapsibleState = TreeItemCollapsibleState.None;

    private config: RhamtConfiguration;
    private classification: IClassification;

    constructor(config: RhamtConfiguration, classification: IClassification) {
        super(config.name);
        this.config = config;
        this.classification = classification;
        this.refresh();
    }

    delete(): void {
        if (this.config.results) {
            this.config.results.getClassifications().find(i => true);
        }
    }

    public get iconPath(): string | Uri | { light: string | Uri; dark: string | Uri } | undefined {
        return undefined;
    }

    public get id(): string {
        return this._id;
    }

    public get commandId(): string {
        return 'rhamt.openClassification';
    }

    public get command(): Command {
        return {
            command: 'rhamt.openClassification',
            title: '',
            arguments: [this.classification.file]
        };
    }

    public get contextValue(): string {
        return 'rhamt.openClassification';
    }

    public refresh(): void {
        this.label = this.classification.title;
    }
}