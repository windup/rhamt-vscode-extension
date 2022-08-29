/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs-extra';
import { RhamtConfiguration } from '../model/model';
import { Utils } from '../Utils';

export function findRhamtCli(outDir: string, config?: RhamtConfiguration): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        if (config) {
            const configCli = config.options['cli'] as string;
            if (configCli) {
                return resolve(configCli.trim());
            }
        }
        const rhamtPath = vscode.workspace.getConfiguration('cli.executable').get<string>('path');
        if (rhamtPath) {
            console.log(`preference cli.executable.path found - ${rhamtPath}`);
            return resolve(rhamtPath);
        }
        let rhamtHome = process.env['CLI_HOME'];
        if (rhamtHome) {
            const executable = getDownloadExecutableName(rhamtHome);
            console.log(`found cli using CLI_HOME`);
            console.log(`WINDUP_HOME=${rhamtHome}`);
            console.log(`executable=${executable}`);
            return resolve(executable);
        }
        rhamtHome = findRhamtCliDownload(outDir);
        if (fs.existsSync(rhamtHome)) {
            console.log(`cli download found at - ${rhamtHome}`);
            const executable = getDownloadExecutableName(rhamtHome);
            console.log(`cli executable - ${executable}`);
            return resolve(executable);
        }
        else {
            console.log('Unable to find cli download');
            reject('Unable to find cli download');
        }
    });
}

export function getDownloadExecutableName(home: string): string {
    const isWindows = process.platform === 'win32';
    let scriptName = Utils.CLI_SCRIPT;
    const executable = scriptName + (isWindows ? '.bat' : '');
    return path.join(home, 'bin', executable);
}

export function findRhamtCliDownload(outDir: string): string {
    return path.join(outDir, Utils.CLI_FOLDER);
}
