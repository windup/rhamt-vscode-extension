/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Command, ThemeIcon, TreeItem, TreeItemCollapsibleState, Uri } from 'vscode';
import { RhamtConfiguration } from '../model/model';

export class ConfigurationItem extends TreeItem {

    collapsibleState: TreeItemCollapsibleState = TreeItemCollapsibleState.None;
    iconPath: string | Uri | { light: string | Uri; dark: string | Uri } | ThemeIcon | undefined;

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
        this.iconPath = this.getIcon();
        let label = this.config.name;
        this.description = '';
        // let highlights: [number, number][] = undefined;
        if (this.config.summary && this.config.summary.active) {
            // const start = label.length;
            // const activeLabel = '(active)';
            // label += ` ${activeLabel}`;
            this.collapsibleState = TreeItemCollapsibleState.Expanded;
            // highlights = [[start + 2, start + activeLabel.length]];
            this.description = '(active)';
        } 
        else {
            this.collapsibleState = TreeItemCollapsibleState.None;
            if (!this.config.summary) {
                // label += ` (unanalyzed)`;
                this.description = '(unanalyzed)';
            }
        }
        this.label = { label /*, highlights */};
    }

    getIcon(): ThemeIcon {
        if (this.config.results && this.config.summary.active) {
            return new ThemeIcon('circle-large-filled');
        }
        return new ThemeIcon('circle-large-outline');
    }
}
