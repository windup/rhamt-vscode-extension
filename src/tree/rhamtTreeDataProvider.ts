import { TreeDataProvider, TreeItem } from 'vscode';
import { ITreeNode } from './abstractNode';
import { HintNode } from './hintNode';
import { ModelService } from '../model/modelService';
import { ClassificationNode } from './classificationNode';

export class RhamtTreeDataProvider implements TreeDataProvider<ITreeNode> {

    private results: any;

    constructor(private modelService: ModelService) {
    }
    
    load(results: any): void {
        this.results = results;
    }

    public getTreeItem(node: ITreeNode): TreeItem {
        return node.treeItem;
    }

    public async getChildren(node?: ITreeNode): Promise<any[]> {
        const children: any = [];
        if (this.results) {
            const hints = this.results.getHints();
            hints.forEach((hint: any) => {
                children.push(new HintNode(hint, this.results.config, this.modelService, this));
            });
            const classifications = this.results.getClassifications();
            classifications.forEach((classification: any) => {
                children.push(new ClassificationNode(classification, this.results.config, this.modelService, this));
            });
        }
        return children;
    }
}