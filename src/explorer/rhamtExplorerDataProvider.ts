'user strict';

import * as vscode from 'vscode';
import { TreeDataProvider, TreeItem, EventEmitter, Event } from "vscode";
import { RhamtModelService } from "raas-core";

export class RhamtTreeDataProvider implements TreeDataProvider<any>, vscode.Disposable {

    private _onDidChangeTreeData: EventEmitter<any> = new EventEmitter<any>();
    readonly onDidChangeTreeData: Event<any> = this._onDidChangeTreeData.event;
    
    constructor(private context: vscode.ExtensionContext,
        private modelService: RhamtModelService) {
        this.context.subscriptions.push(this);
        console.log('modelService config count: ' + this.modelService.getConfiguration);
    }

    public refresh(): any {
		this._onDidChangeTreeData.fire();
    }
    
    public dispose(): void {
    }

    public getTreeItem(element: any): TreeItem {
        return new TreeItem('');
    }

    public async getChildren(element?: any): Promise<any[]> {

        let result: any[];

        if (!element) {
            result = await this.populateRoots();
        }
        else {
            return new Promise<any>(resolve => {
                resolve([]);
            });
        }
        return result;
    }

    private async populateRoots(): Promise<any[]> {
        return Promise.resolve([]);
    }
}
