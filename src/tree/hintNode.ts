import { AbstractNode, ITreeNode } from './abstractNode';
import * as vscode from 'vscode';
import { DataProvider } from './dataProvider';
import { HintItem } from './hintItem';
import { IHint, RhamtConfiguration, ReportHolder, IssueContainer, IIssue } from '../model/model';
import { ModelService } from '../model/modelService';

export class HintNode extends AbstractNode implements ReportHolder, IssueContainer {

    hint: IHint;

    constructor(
        hint: IHint,
        config: RhamtConfiguration,
        modelService: ModelService,
        onNodeCreateEmitter: vscode.EventEmitter<ITreeNode>,
        dataProvider: DataProvider
        ) {
        super(config, modelService, onNodeCreateEmitter, dataProvider);
        this.hint = hint;
        this.treeItem = this.createItem();
    }

    getChildren(): Promise<ITreeNode[]> {
        return Promise.resolve([]);
    }

    delete(): Promise<void> {
        return Promise.resolve();
    }

    createItem(): HintItem {
        const item = new HintItem(this.hint);
        return item;
    }

    getReport(): string {
        return this.hint.report;
    }

    getIssue(): IIssue {
        return this.hint;
    }

    setComplete(): void {
        this.hint.complete = true;
        this.dataProvider.refresh(this);
    }
}