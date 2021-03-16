/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs-extra';

const RHAMT_VERSION = '5.1.3.Final';
const RHAMT_FOLDER = `mta-cli-${RHAMT_VERSION}`;

export function findRhamtCli(outDir: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const rhamtPath = vscode.workspace.getConfiguration('mta.executable').get<string>('path');
        if (rhamtPath) {
            console.log(`preference mta.executable.path found - ${rhamtPath}`);
            return resolve(rhamtPath);
        }
        let rhamtHome = process.env['MTA_HOME'];
        if (rhamtHome) {
            const executable = getRhamtExecutable(rhamtHome);
            console.log(`found mta-cli using MTA_HOME`);
            console.log(`MTA_HOME=${rhamtHome}`);
            console.log(`executable=${executable}`);
            return resolve(executable);
        }
        rhamtHome = findRhamtCliDownload(outDir);

        if (fs.existsSync(rhamtHome)) {
            console.log(`mta-cli download found at - ${rhamtHome}`);
            const executable = getRhamtExecutable(rhamtHome);
            console.log(`mta-cli executable - ${executable}`);
            return resolve(executable);
        }
        else {
            console.log('Unable to find mta-cli download');
            reject(new Error('Unable to find mta-cli download'));
        }
    });
}

export function getRhamtExecutable(home: string): string {
    const isWindows = process.platform === 'win32';
    const executable = 'mta-cli' + (isWindows ? '.bat' : '');
    return path.join(home, 'bin', executable);
}

export function findRhamtCliDownload(outDir: string): string {
    return path.join(outDir, 'mta-cli', RHAMT_FOLDER);
}
