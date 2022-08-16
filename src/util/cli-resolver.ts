/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs-extra';
import { RhamtConfiguration } from '../model/model';

const RHAMT_VERSION = '5.3.1-SNAPSHOT';
const RHAMT_FOLDER = `windup-cli-${RHAMT_VERSION}`;

export function findRhamtCli(outDir: string, config?: RhamtConfiguration): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        if (config) {
            const configCli = config.options['windup-cli'] as string;
            if (configCli) {
                return resolve(configCli.trim());
            }
        }
        const rhamtPath = vscode.workspace.getConfiguration('windup.executable').get<string>('path');
        if (rhamtPath) {
            console.log(`preference windup.executable.path found - ${rhamtPath}`);
            return resolve(rhamtPath);
        }
        let rhamtHome = process.env['WINDUP_HOME'];
        if (rhamtHome) {
            const executable = getRhamtExecutable(rhamtHome);
            console.log(`found windup-cli using WINDUP_HOME`);
            console.log(`WINDUP_HOME=${rhamtHome}`);
            console.log(`executable=${executable}`);
            return resolve(executable);
        }
        rhamtHome = findRhamtCliDownload(outDir);

        if (fs.existsSync(rhamtHome)) {
            console.log(`windup-cli download found at - ${rhamtHome}`);
            const executable = getRhamtExecutable(rhamtHome);
            console.log(`windup-cli executable - ${executable}`);
            return resolve(executable);
        }
        else {
            console.log('Unable to find windup-cli download');
            reject(new Error('Unable to find windup-cli download'));
        }
    });
}

export function getRhamtExecutable(home: string): string {
    const isWindows = process.platform === 'win32';
    const executable = 'windup-cli' + (isWindows ? '.bat' : '');
    return path.join(home, 'bin', executable);
}

export function findRhamtCliDownload(outDir: string): string {
    return path.join(outDir, 'windup-cli', RHAMT_FOLDER);
}
