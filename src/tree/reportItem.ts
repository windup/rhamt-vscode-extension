/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { TreeItem, Uri, TreeItemCollapsibleState, Command } from 'vscode';
import * as path from 'path';
import { ReportHolder, RhamtConfiguration } from '../model/model';
import { ModelService } from '../model/modelService';

export class ReportItem extends TreeItem implements ReportHolder {

    id: string = ModelService.generateUniqueId();

    static LABEL = 'Report';
    private config: RhamtConfiguration;
    private modelService: ModelService;
    collapsibleState: TreeItemCollapsibleState = TreeItemCollapsibleState.None;

    constructor(config: RhamtConfiguration, modelService: ModelService) {
        super(ReportItem.LABEL);
        this.config = config;
        this.modelService = modelService;
    }

    delete(): void {
    }

    public get iconPath(): string | Uri | { light: string | Uri; dark: string | Uri } | undefined {
        const base = [__dirname, '..', '..', '..', 'resources'];
        return process.env.CHE_WORKSPACE_NAMESPACE ? 'fa fa-line-chart medium-blue' : {
            light: path.join(...base, 'light', 'file_type_log.svg'),
            dark: path.join(...base, 'dark', 'file_type_log.svg')
        };
    }

    public get tooltip(): string {
        return '';
    }

    public get commandId(): string {
        return process.env.CHE_WORKSPACE_NAMESPACE ? 
            'theia.open' : 
            'rhamt.openReportExternal';
    }

    getReport(): string {
        return this.config.getReport();
    }

    public get command(): Command {
        console.log(`reportItem::command`);
        return process.env.CHE_WORKSPACE_NAMESPACE ? 
            { 
                command: 'theia.open',
                title: '',
                arguments: [this.modelService.getReportLocation(this.getReport())]
            }: 
            {
                command: 'rhamt.openReportExternal',
                title: '',
                arguments: [this]
            };
    }

    public get contextValue(): string {
        return 'report';
    }
}