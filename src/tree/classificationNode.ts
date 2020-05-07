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
import { ConfigurationNode } from './configurationNode';

export class ClassificationNode extends AbstractNode implements ReportHolder, IssueContainer {

    private classification: IClassification;

    constructor(
        classification: IClassification,
        config: RhamtConfiguration,
        modelService: ModelService,
        onNodeCreateEmitter: vscode.EventEmitter<ITreeNode>,
        dataProvider: DataProvider,
        root: ConfigurationNode
        ) {
        super(config, modelService, onNodeCreateEmitter, dataProvider);
        this.root = root;
        this.classification = classification;
    }

    getChildren(): Promise<ITreeNode[]> {
        return Promise.resolve([]);
    }

    delete(): Promise<void> {
        return Promise.resolve();
    }

    getLabel(): string {
        return this.classification.description;
    }

    createItem(): ClassificationItem {
        this.treeItem = new ClassificationItem(this.classification);
        return this.treeItem as any;
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