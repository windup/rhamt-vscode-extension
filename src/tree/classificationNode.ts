/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { AbstractNode, ITreeNode } from './abstractNode';
import * as vscode from 'vscode';
import { DataProvider } from './dataProvider';
import { ClassificationItem } from './classificationItem';
import { RhamtConfiguration, IClassification, ReportHolder, IssueContainer, IIssue } from '../model/model';
import { ModelService } from '../model/modelService';

export class ClassificationNode extends AbstractNode implements ReportHolder, IssueContainer {

    private classification: IClassification;

    constructor(
        classification: IClassification,
        config: RhamtConfiguration,
        modelService: ModelService,
        onNodeCreateEmitter: vscode.EventEmitter<ITreeNode>,
        dataProvider: DataProvider
        ) {
        super(config, modelService, onNodeCreateEmitter, dataProvider);
        this.classification = classification;
        this.treeItem = this.createItem();
    }

    getChildren(): Promise<ITreeNode[]> {
        return Promise.resolve([]);
    }

    delete(): Promise<void> {
        return Promise.resolve();
    }

    createItem(): ClassificationItem {
        const item = new ClassificationItem(this.classification);
        return item;
    }

    getReport(): string {
        return this.classification.report;
    }

    getIssue(): IIssue {
        return this.classification;
    }

    setComplete(): void {
        this.classification.complete = true;
        this.config.markIssueAsComplete(this.getIssue());
        (this.treeItem as ClassificationItem).refresh();
        this.dataProvider.refresh(this);
    }
}