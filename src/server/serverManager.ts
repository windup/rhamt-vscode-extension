import { ServerRunnerDelegate } from './serverRunnerDelegate';
import { ServerController } from './serverController';
import * as vscode from 'vscode';
import { Utils } from '../Utils';
import * as fs from 'fs';

const START_TIMEOUT = 120000;

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

class RhamtChannelImpl {
    private readonly channel: vscode.OutputChannel = vscode.window.createOutputChannel('RHAMT');
    print(text: string) {
        this.channel.append(text);
        if (text.charAt(text.length - 1) !== '\n') {
            this.channel.append('\n');
        }
        this.channel.show();
    }
}

export const rhamtChannel = new RhamtChannelImpl();

export class ServerStarterUtil {

    static async startServer(): Promise<ServerManager> {
        let rhamtExecutable: string;
        try {
            rhamtExecutable = await ServerStarterUtil.findServerExecutable();
        } catch (e) {
            return Promise.reject();
        }

        const onServerMessage = (data: any) => {
            console.log(data);
            rhamtChannel.print(data);
        };

        const onShutdown = () => {
            console.log('windup-web server shutdown');
        };

        return vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            cancellable: false
        }, async (progress: any) => {
            progress.report({message: 'Executing windup-web startup script...'});
            try {
                const serverManager = await ServerStarterUtil.doStartServer(rhamtExecutable, onServerMessage, onShutdown);
                return Promise.resolve(serverManager);
            } catch (e) {
                console.log(e);
                progress.report({message: `Error: ${e}`});
                return Promise.reject();
            }
        });
    }

    private static async doStartServer(executable: string,
        onServerMessage: (data: any) => void,
        onShutdown: () => void): Promise<ServerManager> {
        return ServerRunnerDelegate.run(executable, START_TIMEOUT, onServerMessage).then(cp => {
            return new ServerManager(new ServerController(executable, cp, onShutdown));
        });
    }

    private static async findServerExecutable(): Promise<string> {
        return vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            cancellable: true
        }, async (progress, token) => {

            progress.report({message: 'Verifying JAVA_HOME'});

            try {
                await Utils.findJavaHome();
            }
            catch (error) {
                Utils.promptForFAQs('Unable to resolve Java Home');
                progress.report({message: 'Unable to verify JAVA_HOME'});
                return Promise.reject();
            }

            progress.report({message: 'Verifying windup-web'});
            let rhamtExecutable: string;
            try {
                rhamtExecutable = await Utils.findRhamtExecutable();
            }
            catch (error) {
                Utils.promptForFAQs('Unable to find windup-web executable');
                progress.report({message: 'Unable to find windup-web executable'});
                return Promise.reject();
            }

            if (!fs.existsSync(rhamtExecutable)) {
                progress.report({message: 'windup-web executable does not exist.'});
                vscode.window.showErrorMessage(`windup-web executable does not exist`);
                return Promise.reject();
            }

            return rhamtExecutable;
        });
    }
}