import { RhamtConfiguration, RhamtModelService } from 'raas-core';
import { Command, TreeItem, TreeItemCollapsibleState, Uri } from 'vscode';

export class ConfigurationItem extends TreeItem {

    id: string = RhamtModelService.generateUniqueId();
    collapsibleState: TreeItemCollapsibleState = TreeItemCollapsibleState.None;
    iconPath: string | Uri | { light: string | Uri; dark: string | Uri } | undefined;

    private config: RhamtConfiguration;

    constructor(config: RhamtConfiguration) {
        super(config.name);
        this.config = config;
        this.refresh();
    }

    public get commandId(): string {
        return 'rhamt.openConfiguration';
    }

    public get command(): Command {
        return {
        command: 'rhamt.openConfiguration',
        title: '',
        arguments: [this.config]
        };
    }

    public get contextValue(): string {
        return 'rhamtConfiguration';
    }

    public refresh(): void {
        this.label = this.config.name;
        if (this.config.results) {
            if (this.config.results.getClassifications().length > 0) {
                this.collapsibleState = TreeItemCollapsibleState.Collapsed;
            }
        }
    }
}