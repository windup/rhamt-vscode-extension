import { AbstractNode, ITreeNode } from './abstractNode';
import * as vscode from 'vscode';
import { DataProvider } from './dataProvider';
import { ClassificationItem } from './classificationItem';
import { RhamtConfiguration, IClassification, MigrationIssue } from '../model/model';
import { ModelService } from '../model/modelService';
import { AnalysisResultsUtil } from '../model/analysisResults';

export class ClassificationNode extends AbstractNode implements MigrationIssue {

    private classification: IClassification;

    constructor(
        classification: IClassification,
        config: RhamtConfiguration,
        modelService: ModelService,
        onNodeCreateEmitter: vscode.EventEmitter<ITreeNode>,
        dataProvider: DataProvider) {
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
        const item = new ClassificationItem(this.config, this.classification);
        return item;
    }

    getReport(): string {
        return this.config.getReport();
    }
}