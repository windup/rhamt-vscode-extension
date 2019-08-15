/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Command, TreeItem, TreeItemCollapsibleState, Uri } from 'vscode';
import { RhamtConfiguration } from '../model/model';
import { ModelService } from '../model/modelService';

export class ConfigurationItem extends TreeItem {

    id: string = ModelService.generateUniqueId();
    collapsibleState: TreeItemCollapsibleState = TreeItemCollapsibleState.None;
    iconPath: string | Uri | { light: string | Uri; dark: string | Uri } | undefined;

    private config: RhamtConfiguration;

    constructor(config: RhamtConfiguration) {
        super('Loading...');
        this.config = config;
        this.refresh();
    }

    public get commandId(): string {
        return 'rhamt.openConfiguration';
    }

    public get command(): Command {
        return process.env.CHE_WORKSPACE_NAMESPACE ? undefined :
            {
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