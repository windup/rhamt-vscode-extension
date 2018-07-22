
import { IProgressMonitor } from "./rhamtService/main";
import * as vscode from "vscode";

export class ProgressMonitor implements IProgressMonitor {

    private workCompleted: number = 0;
    private tasks: Array<string> = [];

    constructor(private completed: () => void, private delegate: 
        vscode.Progress<{message?: string | undefined;increment?: number | undefined;}>) {
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

        if (msg.state) {
            this.delegate.report({ message: value });
        }
    }

    public stop(): void {
        this.completed();   
    }

    public logMessage(message: string) {

    }

    public beginTask(task: string, total: number) {
        this.report({msg:task, work:total});
    }
    
    public done() {
        this.report({msg:'finsished', work: 100});
        this.completed();
        console.log('tasks: ' + this.tasks);
    }

    public setCancelled() {

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

    private report(data: {msg?: string, work?: number}): void {
        console.log('work: ' + data.work + ' msg: ' + data.msg);
        if (data.work) {
            this.workCompleted+=data.work;
            console.log('completed ' + this.workCompleted);
        }
        this.delegate.report({message: data.msg});
    }
}