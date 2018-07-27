'use strict';

import * as vscode from 'vscode';
import { Uri } from "vscode";
import { RhamtConfiguration } from '../rhamtService/main';

export class RhamtNode extends vscode.TreeItem {

	constructor(public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
    }
    
    get tooltip(): string {
		return `${this.label}`;
    }
}

export interface IRhamtElement {
}

export class RhamtElement implements IRhamtElement {
}

export class RhamtConfigurationNode extends RhamtNode {
    constructor(public configuration: RhamtConfiguration) {
		super(configuration.name!, vscode.TreeItemCollapsibleState.None);
	}
}

export class IssueGroupElement extends RhamtElement {
    constructor(public severity: string) {
        super();
    }
}

export class IssueElement extends RhamtElement {
    constructor(public resourceUri: Uri) {
        super();
    }
}

export class ReportElement extends RhamtElement {
}
