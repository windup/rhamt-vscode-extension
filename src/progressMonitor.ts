
import { IProgressMonitor } from "./rhamtService/main";
import * as vscode from "vscode";

export class ProgressMonitor implements IProgressMonitor {

    private workCompleted: number = 0;
    private tasks: Array<string> = [];
    private started: boolean = false;

    constructor(private delegate: vscode.Progress<any>, private closeHandler: any) {

    }

    public handleMessage (err: Error, msg: any): void {
        console.log('client recieved message: ' + JSON.stringify(msg.body));
        this.delegateMessage(msg.body);
    }

    private delegateMessage(msg: any) {
        if (msg.op === 'beginTask') {
           let task = msg.task;
           let work = msg.totalWork;
           this.tasks.push(task);
           this.tasks.push(JSON.stringify(work));
           this.beginTask(task, work);
           return;
        }

        let value = msg.value;
        switch (msg.op) {
            case 'logMessage':
                this.logMessage(value);
                break;
            case 'done': 
                this.done();
                break;
            case 'setTaskName':
                this.setTaskName(value);
                break;
            case 'subTask':
                this.subTask(value);
                break;
            case 'worked':
                this.worked(value);
                break;
        }

        if (!this.started) {
            this.started = true;
            this.delegate.report({ message: 'Starting Analysis...' });
        }
    }

    private doClose(): void {
        this.closeHandler();
    }

    public stop(): void {
        this.doClose();
        
    }

    public logMessage(message: string) {

    }

    public beginTask(task: string, total: number) {
        this.report({msg:task});
        //this.report({msg:task, work:total});
    }
    
    public done() {
        this.report({msg:'finished'});
        this.doClose();
        console.log('tasks: ' + this.tasks);
    }

    public setCancelled() {
        this.report({msg: 'Cancelled'});
        this.doClose();
    }

    public setTaskName(task: string) {
        this.report({msg:task});
    }

    public subTask(task: string) {
        this.report({msg:task});
    }

    public worked(worked: number) {
        this.report({work:worked});
    }

    public report(data: {msg?: string, work?: number}): void {
        console.log('work: ' + data.work + ' msg: ' + data.msg);
        if (data.work) {
            this.workCompleted+=data.work;
            console.log('completed ' + this.workCompleted);
        }
        if (data.msg) {
            this.delegate.report({message: data.msg});
        }
    }
}