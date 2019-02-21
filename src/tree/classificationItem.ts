import { TreeItem, Uri, TreeItemCollapsibleState, Command } from 'vscode';
import { Classification } from '../model/model';

export class ClassificationItem extends TreeItem {
    
    collapsibleState: TreeItemCollapsibleState = TreeItemCollapsibleState.None;

    private classification: Classification;

    constructor(classification: Classification) {
        super(classification.text);
        this.classification = classification;
        this.refresh();
    }

    public get iconPath(): string | Uri | { light: string | Uri; dark: string | Uri } | undefined {
        return undefined;
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
        this.label = this.classification.text;
    }
}