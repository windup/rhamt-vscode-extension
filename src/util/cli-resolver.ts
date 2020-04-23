
import * as vscode from 'vscode';
import * as path from 'path';

const RHAMT_VERSION = '4.3.0.Final';
const RHAMT_FOLDER = `rhamt-cli-${RHAMT_VERSION}`;

export function findRhamtCli(outDir: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const rhamtPath = vscode.workspace.getConfiguration('rhamt.executable').get<string>('path');
        if (rhamtPath) {
            console.log(`preference rhamt.executable.path found - ${rhamtPath}`);
            return resolve(rhamtPath);
        }
        let rhamtHome = process.env['RHAMT_HOME'];
        if (rhamtHome) {
            const executable = getRhamtExecutable(rhamtHome);
            console.log(`found rhamt-cli using RHAMT_HOME`);
            console.log(`RHAMT_HOME=${rhamtHome}`);
            console.log(`executable=${executable}`);
            return resolve(executable);
        }
        rhamtHome = findRhamtCliDownload(outDir);
        if (rhamtHome) {
            console.log(`rhamt-cli download found at - ${rhamtHome}`);
            const executable = getRhamtExecutable(rhamtHome);
            console.log(`rhamt-cli executable - ${executable}`);
            return resolve(executable);
        }
        else {
            console.log('Unable to find rhamt-cli download');
            reject(new Error('Unable to find rhamt-cli download'));
        }
    });
}

export function getRhamtExecutable(home: string): string {
    const isWindows = process.platform === 'win32';
    const executable = 'rhamt-cli' + (isWindows ? '.bat' : '');
    return path.join(home, 'bin', executable);
}

export function findRhamtCliDownload(outDir: string): string {
    return path.join(outDir, 'rhamt-cli', RHAMT_FOLDER);
}