/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';
import { join } from 'path';

export function rndName() {
    return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 10);
}

export function createRandomFile(contents = '', dir: string = os.tmpdir(), ext = '.java'): Thenable<vscode.Uri> {
    return new Promise((resolve, reject) => {
        const tmpFile = join(dir, rndName() + ext);
        fs.writeFile(tmpFile, contents, error => {
            if (error) {
                return reject(error);
            }
            resolve(vscode.Uri.file(tmpFile));
        });
    });
}