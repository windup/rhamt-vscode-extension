import * as io from 'socket.io';
import { rhamtEvents } from '../events';
import { RhamtConfiguration } from '../model/model';

export class ConfigurationClient {

    id: string;

    onUpdateName = new rhamtEvents.TypedEvent<string>();
    onUpdateJvm = new rhamtEvents.TypedEvent<{location: string}>();
    onUpdateCli = new rhamtEvents.TypedEvent<{location: string}>();
    onAddOptionValue = new rhamtEvents.TypedEvent<{option: any, value: string}>();
    onUpdateOption = new rhamtEvents.TypedEvent<{name: string, value: string}>();
    onOpenReport = new rhamtEvents.TypedEvent<void>();
    onPromptWorkspaceFileOrFolder = new rhamtEvents.TypedEvent<void>();
    onPromptWorkspaceFolder = new rhamtEvents.TypedEvent<void>();
    onPromptExternal = new rhamtEvents.TypedEvent<void>();
    onCloneRepo = new rhamtEvents.TypedEvent<string>();
    onStartAnalaysis = new rhamtEvents.TypedEvent<void>();
    onCancelAnalaysis = new rhamtEvents.TypedEvent<void>();
    onDisposed = new rhamtEvents.TypedEvent<void>();

    private socket: io.Socket;

    constructor(socket: io.Socket, id: string) {
        this.socket = socket;
        this.id = id;
    }

    listen(): void {
        this.socket.on('disconnect', () => {
            console.log('ConfigurationClient received event from client :: disconnect -> triggering disposed()???');
            this.onDisposed.emit(undefined);
        });
        this.socket.on('updateName', (msg: any) => {
            this.onUpdateName.emit(msg);
        });
        this.socket.on('updateJvm', (msg: any) => {
            this.onUpdateJvm.emit(msg);
        });
        this.socket.on('updateCli', (msg: any) => {
            this.onUpdateCli.emit(msg);
        });
        this.socket.on('addOptionValue', (msg: any) => {
            this.onAddOptionValue.emit({option: msg.option, value: msg.value});
        });
        this.socket.on('updateOption', (msg: any) => {
            this.onUpdateOption.emit({name: msg.name, value: msg.value});
        });
        this.socket.on('openReport', (msg: any) => {
            this.onOpenReport.emit(undefined);
        });
        this.socket.on('promptWorkspaceFileOrFolder', (msg: any) => {
            this.onPromptWorkspaceFileOrFolder.emit(msg);
        });
        this.socket.on('promptWorkspaceFolder', (msg: any) => {
            this.onPromptWorkspaceFolder.emit(msg);
        });
        this.socket.on('promptExternal', (msg: any) => {
            this.onPromptExternal.emit(msg);
        });
        this.socket.on('cloneRepo', (msg: any) => {
            this.onCloneRepo.emit(msg);
        });
        this.socket.on('startAnalysis', (msg: any) => {
            this.onStartAnalaysis.emit(undefined);
        });
        this.socket.on('cancelAnalysis', (msg: any) => {
            console.log('ConfigurationClient received event from client :: cancelAnalysis');
            this.onCancelAnalaysis.emit(undefined);
        });
    }

    report(msg: string): void {
        this.socket.emit('progressMessage', msg);
    }

    notifyStartingAnalysis(): void {
        this.socket.emit('startingAnalysis');
    }

    notifyAnalyzing(): void {
        this.socket.emit('analysisStarted');
    }

    analysisComplete(config: RhamtConfiguration): void {
        this.socket.emit('analysisComplete', config);
    }

    analysisStopped(): void {
        this.socket.emit('analysisStopped');
    }

    notifyErrorCancellingAnalysis(): void {
        this.socket.emit('errorCancellingAnalysis');
    }

    inputChanged(change: {type: number, name: string, value: any}): void {
        this.socket.emit('inputChanged', change);
    }

    notifyUpdateOption(option: any, options: any): void {
        this.socket.emit('updateOption', {option, options});
    }

    notifyUpdateName(name: string): void {
        this.socket.emit('updateName', name);
    }
}