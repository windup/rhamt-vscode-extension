'use strict';

import * as cp from 'child_process';
import * as os from 'os';
import { RhamtConfiguration } from 'raas-core';

const SERVER_START_TIMEOUT_MS = 15000;

export class RhamtClient {

    private serverProcess?: cp.ChildProcess;
    private isServerRunnig: boolean = false;

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

    public analyze(): Promise<String> {      
        return new Promise<String>((resolve, reject) => {
            if (!this.isRunning()) {
                reject();
            }
            else {
                const payload = { config: this.config };
                console.log(`rhamt-client sent the analyze request - ${payload}`);
            }      
        });
    }

    public isRunning(): boolean {
        return this.isServerRunnig;
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
            this.isServerRunnig = false;
        });
    }

    private startRhamtServer(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.isServerRunnig = true;

            let started = false;
            let connected = false;
            this.serverProcess = this.spawn();

            this.serverProcess.once('error', () => this.terminate());
            this.serverProcess.on('exit', () => this.terminate());
            
            const outputListener = (data: string | Buffer) => {
            };

            this.serverProcess.stdout.addListener('data', outputListener);
            setTimeout(() => {
                if (!started && !connected) {
                    console.log('rhamt-client server startup timeout.');
                    this.terminate();
                    reject();
                }
            }, SERVER_START_TIMEOUT_MS);
        });
    }

    private spawn(): cp.ChildProcess {
        console.log('rhamt-client using ' + JSON.stringify(this.config));
        return cp.spawn(this.config.cli, 
            ["--startServer", String(this.config.runtime.port)], {cwd: os.homedir()});
    }

    public handleMessage (err: Error, msg: any): void {
    }
}