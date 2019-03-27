import { ServerRunnerDelegate } from './serverRunnerDelegate';
import { ServerController } from './serverController';

const START_TIMEOUT = 60000;

export class ServerManager {

    private controller: ServerController;

    constructor(controller: ServerController) {
        this.controller = controller;
    }

    getExecutable(): string {
        return this.controller.executable;
    }

    shutdown(): void {
        this.controller.shutdown();
    }
}

export class ServerStarter {
    static async startServer(
        executable: string,
        onServerMessage: (data: any) => void,
        onShutdown: () => void): Promise<ServerManager> {
        return ServerRunnerDelegate.run(executable, START_TIMEOUT, onServerMessage).then(cp => {
            return new ServerManager(new ServerController(executable, cp, onShutdown));
        });
    }
}