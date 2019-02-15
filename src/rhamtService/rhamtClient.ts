'use strict';

import * as cp from 'child_process';
import * as os from 'os';
import { RhamtConfiguration } from 'raas-core';

export class RhamtClient {

    private serverProcess?: cp.ChildProcess;

    private config: RhamtConfiguration

    constructor(config: RhamtConfiguration) {
        this.config = config;
    }

    public async start(): Promise<any> {
        return this.startRhamtServer();
    }

    public stop(): Promise<string> {
        return this.terminate();
    }

    public cancel(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            resolve();
        });
    }

    public analyze(): void {
        // TODO: start analysis
    }

    public terminate(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            if (this.serverProcess && !this.serverProcess.killed) {
                this.serverProcess.kill();
                resolve();
            }
            else {
                reject('RHAMT server not running.');
            }
        });
    }

    private startRhamtServer(): void {
        this.serverProcess = this.spawn();
    }

    private spawn(): cp.ChildProcess {
        return cp.spawn(this.config.cli, 
            ["--startServer", String(this.config.runtime.port)], {cwd: os.homedir()});
    }
}