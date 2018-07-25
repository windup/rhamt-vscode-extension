'use strict';

import { IProgressMonitor } from "./rhamtService/main";
import * as vscode from "vscode";

export class ProgressMonitor implements IProgressMonitor {

    private isCancelled: boolean = false;
    private isDone: boolean = false;

    private preWork: number = 0;
    private totalWork: number = 0;

    private title: string = '';

    private started: boolean = false;
    private finalizing: boolean = false;

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
            this.report('Launching analysis...');
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
        this.title = 'Migration assessment in progress';
        this.totalWork = total;
        this.setTitle(this.title);
    }
    
    public done() {
        this.report('Done');
        this.isDone = true;
        this.doClose();
    }

    public setCancelled() {
        this.report('Cancelled');
        this.isCancelled = true;
        this.doClose();
    }

    public setTaskName(task: string) {
        this.report(task);
    }

    public subTask(name: string): void {
        /*let phase = Phase.find(name);
        if (phase) {
            let title = this.computeTitle() + ' - ' + phase;
            this.setTitle(title);
        }*/
	}

    public worked(worked: number) {
        this.preWork += worked;
        this.setTitle(this.computeTitle());
    }

    private getPercentangeDone(): number {
		return Math.trunc(Math.min((this.preWork * 100 / this.totalWork), 100));
	}

    private computeTitle(): string {
        let done = this.getPercentangeDone();
		let label = this.title;
		if (done > 0) {
			label+= " (" + done + "% done)";
        }
        return label;
    }
    
    private setTitle(value: string): void {
        this.report(value);
    }

    public report(msg: string): void {
        if (!this.isDone && !this.isCancelled && !this.finalizing) {
            if (this.getPercentangeDone() === 99) {
                this.finalizing = true;
                setTimeout(() => null, 500);
                msg = 'Finalizing assessment...';
            }
            this.delegate.report({message: msg});   
        }
        else {
            console.log('progress done or cancelled, cannot report: ' + msg);
        }
    }
}

/*class Phase {

    private static phases: Array<{id: string, desc: string}> = [
        {id: 'InitializationPhase', desc: 'Initializing'},
        {id: 'DiscoveryPhase', desc: 'Gathering rules'},
        {id: 'InitialAnalysisPhase', desc: 'Rules loaded. Preparing to process'},
        {id: 'MigrationRulesPhase', desc: 'Analyzing'},
        {id: 'ReportGenerationPhase', desc: 'Analysis complete. Preparing report'},
        {id: 'ReportRenderingPhase', desc: 'Generating report'},
        {id: 'PostFinalizePhasePhase', desc: 'Finalizing. One moment'}
    ];

    private static matches(task: string, id: string): boolean {
        return task.indexOf(id) !== -1;
    }

    public static find(task: string): string | undefined {
        for (var phase of Phase.phases) {
            if (Phase.matches(task, phase.id)) {
                return phase.desc;
            }
        }
        return undefined;
    }
}*/