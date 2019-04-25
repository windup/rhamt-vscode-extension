import { TreeItem, Uri, TreeItemCollapsibleState, Command } from 'vscode';
import { ModelService } from '../model/modelService';
import { RhamtConfiguration, IHint } from '../model/model';
import * as path from 'path';

export class HintItem extends TreeItem {

    private _id: string = ModelService.generateUniqueId();
    collapsibleState: TreeItemCollapsibleState = TreeItemCollapsibleState.None;

    private config: RhamtConfiguration;
    private hint: IHint;

    constructor(config: RhamtConfiguration, hint: IHint) {
        super(hint.id);
        this.config = config;
        this.hint = hint;
        this.refresh();
    }

    delete(): void {
    }

    public get iconPath(): string | Uri | { light: string | Uri; dark: string | Uri } | undefined {
        return {
            light: path.join(__dirname, '..', '..', '..', 'resources', 'light', 'error.svg'),
            dark: path.join(__dirname, '..', '..', '..', 'resources', 'light', 'error.svg')
        };
    }

    public get id(): string {
        return this._id;
    }

    public get commandId(): string {
        return 'rhamt.openDoc';
    }

    public get command(): Command {
        return {
            command: 'rhamt.openDoc',
            title: '',
            arguments: [this.hint.file]
        };
    }

    public get contextValue(): string {
        return 'issue';
    }

    public refresh(): void {
        this.label = `hint - ${this.hint.messageOrDescription}`;
    }
}