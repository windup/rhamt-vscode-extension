'use strict';

import * as cp from 'child_process';
import { IRhamtClient, IRunConfiguration, ServerConfiguration } from './main';
import * as os from 'os';
import * as EventBus from 'vertx3-eventbus-client';

const SERVER_STARTED_REGEX = /.*rhamt server listening on (.*)/;
const DURATION_REGEX = /RHAMT execution took (.*)/;
const SERVER_START_TIMEOUT_MS = 15000;
const CLIENT = 'http://localhost:8080/eventbus';

export class RhamtClient implements IRhamtClient {

    private serverProcess?: cp.ChildProcess;
    private bus?: EventBus.EventBus;
    private isServerRunnig: boolean = false;

    private runConfiguration?: IRunConfiguration;

    constructor(private serverConfiguration: ServerConfiguration) {
    }

    public async start(): Promise<any> {
        return this.startRhamtServer();
    }

    public stop(): Promise<string> {
        return this.terminate();
    }

    public cancel(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.bus!.send('rhamt.server', {'stop': true}, (error: Error, message: any) => {
                console.log('message after stopping: ' + JSON.stringify(message));
                console.log('error after stopping: ' + JSON.stringify(error));
                if (!error) {
                    //this.runConfiguration!.monitor.setCancelled();
                    resolve();
                }
                else {
                    reject('error occurred while trying to stop analysis: ' + JSON.stringify(error));
                }
            });
        });
    }

    public analyze(config: IRunConfiguration): Promise<String> {
        // TODO: Best way to make sure we no longer receive events 
        // from a previous analysis that's running. 
        
        // Send a stop even to server, then on callback we start.        
        return new Promise<String>((resolve, reject) => {
            if (!this.isRunning()) {
                reject();
            }
            else {
                const load = {
                    'input': [{'location' : config.input}],
                    'output': config.output,
                    'start': true
                };
                this.bus!.send('rhamt.server', load, (error: Error, message: any) => {
                    console.log('message after sending: ' + JSON.stringify(message));
                    console.log('error after sending: ' + JSON.stringify(error));
                    if (!error) {
                        this.runConfiguration = config;
                        resolve();
                    }
                    else {
                        reject('rhamt server error: ' + JSON.stringify(error));
                    }
                });
                console.log('rhamt-client sent the analyze request.');
            }      
        });
    }

    public isRunning(): boolean {
        return this.isServerRunnig;
    }
    
    public terminate(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            console.log('attemting to terminate server process...');
            if (this.serverProcess && !this.serverProcess.killed) {
                console.log('terminating server process...');
                this.serverProcess.kill();
                //this.monitor!.stop();
                //this.runConfiguration!.monitor.stop();
                this.bus!.close();
                this.serverConfiguration!.stoppedCallback();
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
                const line = data.toString();
                console.log('attempting to match server output string: ' + line);
                const match = SERVER_STARTED_REGEX.exec(line);
                if (match) {
                    console.log('rhamt-client server started.');
                    console.log('setting up sockets.');
                    started = true;
                    this.serverProcess!.stdout.removeListener('data', outputListener);
                    this.bus = new EventBus(CLIENT);
                    this.bus.onopen = () => {
                        console.log('rhamt-client sockets connected.');
                        console.log('attemtping to setup progress monitor...');
                        this.bus!.registerHandler('rhamt.client', {}, this.handleMessage.bind(this));
                        connected = true;
                        this.isServerRunnig = true;
                        resolve();
                    };
                    console.log('rhamt-client finished trying to setup sockets.');
                }
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
        console.log('rhamt-client using ' + JSON.stringify(this.serverConfiguration));
        return cp.spawn(this.serverConfiguration.rhamtCli, 
            ["--startServer", String(this.serverConfiguration.port)], {cwd: os.homedir()});
    }

    public handleMessage (err: Error, msg: any): void {
        this.runConfiguration!.handleMessage(err, msg);
    }
}