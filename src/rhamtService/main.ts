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
    id: string;
    monitor: IProgressMonitor;
}

export class RunConfiguration implements IRunConfiguration {
    constructor(public id: string, public monitor: IProgressMonitor) {
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
