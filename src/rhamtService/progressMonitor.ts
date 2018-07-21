
import { IProgressMonitor } from "./main";
import * as EventBus from 'vertx3-eventbus-client';

const CLIENT = 'rhamt.client.';

export class ProgressMonitor implements IProgressMonitor {

    private path?: string;
    private bus?: EventBus.EventBus;
    private stopped: boolean = false;

    public init(address: string, path: string): Promise<any> {
        this.bus = new EventBus(address);
        this.path = path;
        return new Promise<any>((resolve, reject) => {
            this.bus!.onopen = () => {
                console.log('progress monitor eventBus opened');
                this.bus!.registerHandler(this.path!, {}, this.handleMessage);
                resolve();
            };
        });
    }

    private handleMessage (err: Error, msg: any):  void {
        console.log('client recieved message: ' + JSON.stringify(msg.body));
        this.delegateMessage(JSON.stringify(msg.body));
    }

    public stop(): void {
        /*if (!this.stopped) {
            this.stopped = true;
            this.bus!.unregisterHandler(this.path!, {}, this.handleMessage);
            this.bus!.close();  
        }*/    
    }

    private delegateMessage(msg: string) {

    }

    public logMessage(message: string) {

    }

    public beginTask(task: string, total: number) {

    }
    
    public done() {
    }

    public setCancelled() {

    }

    public setTaskName(task: string) {

    }

    public subTask(task: string) {

    }

    public worked(worked: number) {

    }
}