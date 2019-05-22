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
            return {
                light: path.join(...base, 'light', 'complete.svg'),
                dark: path.join(...base, 'dark', 'complete.svg')
            };
        }
        else if (!this.classification.category || this.classification.category.includes('error') || this.classification.category.includes('mandatory')) {
            return {
                light: path.join(...base, 'status-error.svg'),
                dark: path.join(...base, 'dark', 'status-error-inverse.svg')
            };
        }
        else if (this.classification.category.includes('potential')) {
            return {
                light: path.join(...base, 'light', 'status-warning.svg'),
                dark: path.join(...base, 'dark', 'status-warning-inverse.svg')
            };
        }
        return {
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
        return {
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