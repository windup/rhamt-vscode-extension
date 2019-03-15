import { Command, TreeItem, TreeItemCollapsibleState, Uri } from 'vscode';
import { RhamtConfiguration } from '../model/model';

export class ConfigurationElement extends TreeItem {

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
    }
}