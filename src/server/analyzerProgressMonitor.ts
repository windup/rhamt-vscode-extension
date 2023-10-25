/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export class AnalyzerProgressMonitor {
    private _done: boolean = false;

    constructor(private onComplete: any) {
    }

    public handleMessage(msg: any): void {
        this.delegateMessage(msg);
    }

    private delegateMessage(msg: any) {
        if (msg && msg.includes('generating static report')) {
            this.onComplete();
        }
    }

    public isDone(): boolean {
        return this._done;
    }
}