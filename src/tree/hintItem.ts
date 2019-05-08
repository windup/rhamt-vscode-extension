import { TreeItem, Uri, TreeItemCollapsibleState, Command } from 'vscode';
import { ModelService } from '../model/modelService';
import { IHint } from '../model/model';
import * as path from 'path';

export class HintItem extends TreeItem {

    private _id: string = ModelService.generateUniqueId();
    collapsibleState: TreeItemCollapsibleState = TreeItemCollapsibleState.None;

    private hint: IHint;

    constructor(hint: IHint) {
        super(hint.title);
        this.hint = hint;
        this.refresh();
    }

    delete(): void {
    }

    public get iconPath(): string | Uri | { light: string | Uri; dark: string | Uri } | undefined {
        const base = [__dirname, '..', '..', '..', 'resources'];
        if (!this.hint.category || this.hint.category.includes('error') || this.hint.category.includes('mandatory')) {
            return {
                light: path.join(...base, 'status-error.svg'),
                dark: path.join(...base, 'dark', 'status-error-inverse.svg')
            };
        }
        else if (this.hint.category.includes('potential')) {
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
        return this.hint.hint;
    }

    public get commandId(): string {
        return 'rhamt.openDoc';
    }

    public get command(): Command {
        return {
            command: 'rhamt.openDoc',
            title: '',
            arguments: [
                {
                    uri: this.hint.file,
                    line: this.hint.lineNumber - 1,
                    column: this.hint.column,
                    length: this.hint.length + this.hint.column,
                    issue: this.hint
                }
            ]
        };
    }

    public get contextValue(): string {
        return 'issue';
    }

    public refresh(): void {
        this.label = `${this.hint.title} [rule-id: ${this.hint.ruleId}]`;
    }
}