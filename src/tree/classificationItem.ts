/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
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

    private getIconPath(): string | Uri | { light: string | Uri; dark: string | Uri } | undefined {
        const base = [__dirname, '..', '..', '..', 'resources'];
        if (this.classification.complete) {
            return process.env.CHE_WORKSPACE_NAMESPACE ? 'fa medium-green fa-check' : {
                light: path.join(...base, 'light', 'complete.svg'),
                dark: path.join(...base, 'dark', 'complete.svg')
            };
        }
        else if (!this.classification.category || this.classification.category.includes('error') || this.classification.category.includes('mandatory')) {
            return process.env.CHE_WORKSPACE_NAMESPACE ? 'fa medium-red fa-times-circle' : {
                light: path.join(...base, 'light', 'status-error.svg'),
                dark: path.join(...base, 'dark', 'status-error-inverse.svg')
            };
        }
        else if (this.classification.category.includes('potential')) {
            return process.env.CHE_WORKSPACE_NAMESPACE ? 'fa fa-exclamation-circle medium-yellow' : {
                light: path.join(...base, 'light', 'status-warning.svg'),
                dark: path.join(...base, 'dark', 'status-warning-inverse.svg')
            };
        }
        return process.env.CHE_WORKSPACE_NAMESPACE ? 'fa fa-question-circle medium-blue' : {
            light: path.join(...base, 'light', 'status-info.svg'),
            dark: path.join(...base, 'dark', 'status-info-inverse.svg')
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
        return process.env.CHE_WORKSPACE_NAMESPACE ? undefined : {
            command: 'rhamt.openDoc',
            title: '',
            arguments: [{
                uri: this.classification.file,
                issue: this.classification
            }]
        };
    }

    public get contextValue(): string {
        return 'issue';
    }

    public refresh(): void {
        this.iconPath = this.getIconPath();
        this.label = this.classification.description;
    }
}