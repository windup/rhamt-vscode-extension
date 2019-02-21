import { TreeItem, Uri, TreeItemCollapsibleState, Command } from 'vscode';
import { Hint } from '../model/model';

export class HintItem extends TreeItem {

    collapsibleState: TreeItemCollapsibleState = TreeItemCollapsibleState.None;

    private hint: Hint;

    constructor(hint: Hint) {
        super(hint.text);
        this.hint = hint;
        this.refresh();
    }

    public get iconPath(): string | Uri | { light: string | Uri; dark: string | Uri } | undefined {
        return undefined;
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
        this.label = `${this.hint.text}`;
    }
}