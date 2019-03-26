import { ServerRunnerDelegate } from './serverRunnerDelegate';

export class ServerRunner {
    static async run(executable: string, timeout: number,
        onMessage: (data: string) => void): Promise<any> {
        return ServerRunnerDelegate.run(executable,
            timeout, data => {
                onMessage(data);
            }
        );
    }
}