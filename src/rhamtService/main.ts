'use strict';

export * from './model';
export * from './rhamtClient';

export enum METHOD {
    start,
    stop
}

export interface IProgressMonitor {
    handleMessage (err: Error, msg: any): void;
    stop(): void;
    logMessage(message: string): void;
    beginTask(task: string, total: number): void;
    done(): void;
    setCancelled(): void;
    setTaskName(task: string): void;
    subTask(task: string): void;
    worked(worked: number): void;
}

export interface IRunConfiguration {
    handleMessage: (err: Error, msg: any) => void;
    id: string;
    input: string;
    output: string;
}

export class RunConfiguration implements IRunConfiguration {
    public handleMessage: (err: Error, msg: any) => void = () => {};
    constructor(public id: string, public input: string, public output: string) {
    }
}

export class ServerConfiguration {
    public stoppedCallback: () => void = () => {};
    public timeoutCallback: () => void = () => {};
    
    constructor (
        public rhamtCli: string, 
        public port: number = 8080, 
        public javaHome: string) {
    }
}

export interface IRhamtClient {
    start(): Promise<any>;
    stop(): void;
    analyze(config: IRunConfiguration): Promise<any>;
    isRunning(): boolean;
}
