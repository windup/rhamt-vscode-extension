/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export class AnalyzerProgressMonitor {
    private _done: boolean = false;

    constructor(private onComplete: any, private delay: number) {
    }

    public handleMessage(msg: any): void {
        this.delegateMessage(msg);
    }

    private delegateMessage(msg: any) {
        if (msg && msg.includes('generating static report')) {
            (async () => setTimeout(async () => {
                try {
                    this.onComplete();
                }
                catch (e) {
                    console.log(e);
                    console.log('error while completing.');
                }
            }, this.delay))();
        }
    }

    public isDone(): boolean {
        return this._done;
    }
}