/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Command, TreeItem, TreeItemCollapsibleState, Uri } from 'vscode';
import { RhamtConfiguration } from '../model/model';

export class ConfigurationItem extends TreeItem {

    collapsibleState: TreeItemCollapsibleState = TreeItemCollapsibleState.None;
    iconPath: string | Uri | { light: string | Uri; dark: string | Uri } | undefined;

    config: RhamtConfiguration;

    constructor(config: RhamtConfiguration) {
        super('Loading...');
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
            arguments: [this]
        };
    }

    public get contextValue(): string {
        let results = this.config.results ? '-hasResults' : '';
        if (results) {
            results += this.config.summary.active ? '-isActive' : '-notActive';
        }
        return 'rhamtConfiguration' + results;
    }

    public refresh(): void {
        let text = this.config.name;
        if (this.config.summary && this.config.summary.active) {
            text += ` (active)`;
            this.collapsibleState = TreeItemCollapsibleState.Expanded;
        } 
        else {
            this.collapsibleState = TreeItemCollapsibleState.None;
        }
        this.label = text;
    }
}
