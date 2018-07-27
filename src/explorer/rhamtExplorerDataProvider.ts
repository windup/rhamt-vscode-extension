'user strict';

import * as vscode from 'vscode';
import { TreeDataProvider, TreeItem, EventEmitter, Event } from "vscode";
import { RhamtModelService } from "../rhamtService/modelService";
import { RhamtConfiguration } from '../rhamtService/main';
import { RhamtConfigurationNode } from './rhamtNode';


export class RhamtTreeDataProvider implements TreeDataProvider<any>, vscode.Disposable {

    private _onDidChangeTreeData: EventEmitter<any> = new EventEmitter<any>();
    readonly onDidChangeTreeData: Event<any> = this._onDidChangeTreeData.event;
    
    constructor(private context: vscode.ExtensionContext,
        private modelService: RhamtModelService) {
        this.context.subscriptions.push(this);
    }

    public refresh(): any {
		this._onDidChangeTreeData.fire();
    }
    
    public dispose(): void {
    }

    public getTreeItem(element: any): TreeItem {
		if (element instanceof RhamtConfiguration) {
            return new RhamtConfigurationNode(element);
        }
        return {
            label: 'unknown'
        };
    }

    public getChildren(element?: any): Thenable<any[]> {
        if (!element) {
            return new Promise<RhamtConfiguration[]>(resolve => {
                resolve(this.modelService.model.getConfigurations());
            });
        }
        else {
            return new Promise<any>(resolve => {
                resolve([]);
            });
        }
    }
}
