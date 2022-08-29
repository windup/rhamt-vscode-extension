/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as cp from 'child_process';
import * as os from 'os';
const STARTED_REGEX = /.*CLI, version (.*)/;

export class RhamtRunner {
    static run(home: string, executable: string, data: any[], startTimeout: number,
        out: (msg: string) => void, onShutdown: () => void): Promise<cp.ChildProcess> {
        return new Promise<cp.ChildProcess>((resolve, reject) => {
            let started = false;
            const rhamtProcess = cp.spawn(executable, data, {
                cwd: os.homedir(),
                env: Object.assign(
                    {},
                    process.env, 
                    // {
                    //     WINDUP_HOME: ''
                    // }
                )
            });
            rhamtProcess.on('error', () => {
                onShutdown();
            });
            rhamtProcess.on('close', () => {
                onShutdown();
            });
            const outputListener = (data: string | Buffer) => {
                const line = data.toString().trim();
                console.log(line);
                out(line);
                if (STARTED_REGEX.exec(line) && !started) {
                    started = true;
                    resolve(rhamtProcess);
                }
            };
            rhamtProcess.stdout.addListener('data', outputListener);
            setTimeout(() => {
                if (!started) {
                    rhamtProcess.kill();
                    reject(`cli startup time exceeded ${startTimeout}ms.`);
                }
            }, startTimeout);
        });
    }
}