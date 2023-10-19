/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as cp from 'child_process';

export class AnalyzerProcessController {

    executable: string;
    private server: cp.ChildProcess;
    private onShutdown: () => void;

    constructor(executable: string, server: cp.ChildProcess, onShutdown: () => void) {
        this.executable = executable;
        this.server = server;
        this.onShutdown = onShutdown;
        this.init();
    }

    init(): void {
        const shutdown = this.shutdown.bind(this);
        this.server.on('exit', shutdown);
        this.server.once('error', shutdown);
    }

    shutdown(): void {
        if (this.server.pid && !this.server.killed) {
            this.server.kill();
        }
        this.onShutdown();
    }
}