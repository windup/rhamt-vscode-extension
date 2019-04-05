import { TreeItem, Uri, TreeItemCollapsibleState, Command } from 'vscode';
import { ModelService } from '../model/modelService';
import { RhamtConfiguration, IHint } from '../model/model';

export class HintItem extends TreeItem {

    private _id: string = ModelService.generateUniqueId();
    collapsibleState: TreeItemCollapsibleState = TreeItemCollapsibleState.None;

    private config: RhamtConfiguration;
    private hint: IHint;

    constructor(config: RhamtConfiguration, hint: IHint) {
        super(config.options['name']);
        this.config = config;
        this.hint = hint;
        this.refresh();
    }

    delete(): void {
        if (this.config.results) {
            this.config.results.getHints().find(i => true);
        }
    }

    public get iconPath(): string | Uri | { light: string | Uri; dark: string | Uri } | undefined {
        return undefined;
    }

    public get id(): string {
        return this._id;
    }

    public get commandId(): string {
        return 'rhamt.openHint';
    }

    public get command(): Command {
        return {
            command: 'rhamt.openHint',
            title: '',
            arguments: [this.hint.file]
        };
    }

    public get contextValue(): string {
        return 'rhamt.openHint';
    }

    public refresh(): void {
        this.label = `hint - ${this.hint.messageOrDescription}`;
    }
}