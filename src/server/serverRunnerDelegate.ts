import * as cp from 'child_process';
import * as os from 'os';
const SERVER_STARTED_REGEX = /.*Admin console listening on (.*)/;

export class ServerRunnerDelegate {
    static run(executable: string, startTimeout: number,
        out: (msg: string) => void): Promise<cp.ChildProcess> {
        return new Promise<cp.ChildProcess>((resolve, reject) => {
            let started = false;
            const process = cp.spawn(executable, undefined, {cwd: os.homedir()});
            const outputListener = (data: string | Buffer) => {
                const line = data.toString();
                out(line);
                if (SERVER_STARTED_REGEX.exec(line) && !started) {
                    started = true;
                    resolve(process);
                }
            };
            process.stdout.addListener('data', outputListener);
            setTimeout(() => {
                if (!started) {
                    process.kill();
                    reject(`startup time exceeded ${startTimeout}ms.`);
                }
            }, startTimeout);
        });
    }
}