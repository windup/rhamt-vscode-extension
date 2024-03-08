/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as cp from 'child_process';
import * as os from 'os';
// const STARTED_REGEX = /.*running source code analysis.*/;

import { rhamtChannel } from '../util/console';

export class AnalyzerRunner {
    static run(executable: string, data: any[], startTimeout: number,
        out: (msg: string) => void, onShutdown: () => void): Promise<cp.ChildProcess> {
        return new Promise<cp.ChildProcess>((resolve, reject) => {
            let started = false;
            let killed = false;

            rhamtChannel.print('\n');  
  
            const rhamtProcess = cp.spawn(executable, data, {
                cwd: os.homedir(),
                env: Object.assign(
                    {},
                    process.env,
                )
            });
            rhamtProcess.on('error', e => {
                console.log(e);
                rhamtChannel.print("Error executing analyzer");
                if (e && e.message) {
                    rhamtChannel.print('\n');
                    rhamtChannel.print(e.name + ' : ' + e.message);
                    rhamtChannel.print('\n'); 
                    rhamtProcess.kill();
                    killed = true;
                }
                onShutdown();
            });
            rhamtProcess.on('close', e => {
                console.log('cli process closed');
                console.log(e);                
                onShutdown();
            });
            const outputListener = (data: string | Buffer) => {
                const line = data.toString().trim();
                console.log(line);
                out(line);
                if (!started) {
                    started = true;
                    resolve(rhamtProcess);
                }
                // if (STARTED_REGEX.exec(line) && !started) {
                //     started = true;
                //     resolve(rhamtProcess);
                // }
            };
            rhamtProcess.stdout.addListener('data', outputListener);
            setTimeout(() => {
                if (!started && !killed) {
                    rhamtProcess.kill();
                    reject(`analyzer startup time exceeded ${startTimeout}ms.`);
                }
            }, startTimeout);
        });
    }
}