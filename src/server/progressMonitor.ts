/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { rhamtChannel } from '../util/console';

export class ProgressMonitor {

    private started: boolean = false;
    private preWork: number = 0;
    private title: string = '';
    private totalWork: number = 0;
    private finalizing: boolean = false;
    private _done: boolean = false;

    constructor(private delegate: any, private onComplete: any) {
    }

    public handleMessage(msg: any): void {
        this.delegateMessage(msg);
    }

    private delegateMessage(msg: any) {
        if (msg.op === 'beginTask') {
            const task = msg.task;
            const work = msg.totalWork;
            this.beginTask(task, work);
            return;
        }

        if (msg.op === 'complete') {
            this.finalize();
            return;
        }

        const value = msg.value;
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

    public logMessage(message: string) {
        rhamtChannel.print(message);
        rhamtChannel.print('\n');
    }

    public beginTask(task: string, total: number) {
        this.title = 'Analysis in progress';
        this.totalWork = total;
        this.setTitle(this.title);
    }

    public done() {
        this._done = true;
        this.report('Finalizing...');
    }

    public isDone(): boolean {
        return this._done;
    }

    public setTaskName(task: string) {
        this.report(task);
    }

    public subTask(name: string): void {
        rhamtChannel.print(name);
        rhamtChannel.print('\n');
    }

    public worked(worked: number) {
        this.preWork += worked;
        this.setTitle(this.computeTitle());
    }

    private getPercentangeDone(): number {
        return Math.trunc(Math.min((this.preWork * 100 / this.totalWork), 100));
    }

    private computeTitle(): string {
        const done = this.getPercentangeDone();
        let label = this.title;
        if (done > 0) {
            label += ` (${done} % done)`;
        }
        return label;
    }

    private setTitle(value: string): void {
        this.report(value);
    }

    public report(msg: string): void {
        if (!this._done && !this.finalizing) {
            if (this.getPercentangeDone() === 99) {
                this.finalizing = true;
                setTimeout(() => null, 500);
                msg = 'Finalizing...';
            }
            this.delegate.report({ message: msg });
        }
        else {
            console.log('progress done or cancelled, cannot report: ' + msg);
        }
    }

    private finalize(): void {
        console.log('analysis complete...');
        this.finalizing = true;
        setTimeout(() => null, 500);
        this.onComplete();
    }
}