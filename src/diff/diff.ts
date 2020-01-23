/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IIssue } from "../model/model";
import * as vscode from 'vscode';

export class Diff {

    static compare(issue: IIssue): void {
    }

    static async openDiff(original: vscode.Uri, modified: string): Promise<any> {
    }
}