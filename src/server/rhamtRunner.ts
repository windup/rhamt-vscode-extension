import * as cp from 'child_process';
import * as os from 'os';
const STARTED_REGEX = /.*Red Hat Application Migration Toolkit (.*)/;

export class RhamtRunner {
    static run(executable: string, data: any[], startTimeout: number,
        out: (msg: string) => void): Promise<cp.ChildProcess> {
        return new Promise<cp.ChildProcess>((resolve, reject) => {
            let started = false;
            const process = cp.spawn(executable, data, {cwd: os.homedir()});
            const outputListener = (data: string | Buffer) => {
                const line = data.toString();
                out(line);
                if (STARTED_REGEX.exec(line) && !started) {
                    started = true;
                    console.log('started....');
                    resolve(process);
                }
            };
            process.stdout.addListener('data', outputListener);
            setTimeout(() => {
                if (!started) {
                    console.log('Timeout...');
                    process.kill();
                    reject(`rhamt-cli startup time exceeded ${startTimeout}ms.`);
                }
            }, startTimeout);
        });
    }
}