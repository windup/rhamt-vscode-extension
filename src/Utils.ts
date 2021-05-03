/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { ExtensionContext, workspace, extensions, window, ProgressLocation } from 'vscode';
import * as path from 'path';
import * as fse from 'fs-extra';
import * as child_process from 'child_process';
import { RhamtConfiguration } from './model/model';
import { RhamtInstaller } from './util/rhamt-installer';
import { ModelService } from './model/modelService';
import { promptForFAQs } from './util/faq';
import * as cliResolver from './util/cli-resolver';

const RHAMT_VERSION_REGEX = /^version /;

const findJava = require('find-java-home');

// const PREVIEW_DOWNLOAD_CLI_LOCATION = 'https://oss.sonatype.org/content/groups/public/org/jboss/windup/mta-cli/5.0.0.Final/mta-cli-5.0.0.Final-offline.zip';
// const PREVIEW_DOWNLOAD_CLI_LOCATION = 'https://github.com/johnsteele/windup/releases/download/v5.0.1-SNAPSHOT/mta-cli-5.0.1-SNAPSHOT-offline.zip';

// const PREVIEW_DOWNLOAD_CLI_LOCATION = 'https://repo.maven.apache.org/maven2/org/jboss/windup/mta-cli/5.1.4.Alpha1/mta-cli-5.1.4.Alpha1-offline.zip';
const PREVIEW_DOWNLOAD_CLI_LOCATION = 'https://oss.sonatype.org/content/repositories/snapshots/org/jboss/windup/mta-cli/5.1.4-SNAPSHOT/mta-cli-5.1.4-20210429.124817-43-offline.zip';

const IGNORE_RHAMT_DOWNLOAD = 'ignoreRhamtDownload';

export namespace Utils {

    let EXTENSION_PUBLISHER: string;
    let EXTENSION_NAME: string;

    export async function loadPackageInfo(context: ExtensionContext): Promise<void> {
        const { publisher, name } = await fse.readJSON(context.asAbsolutePath('./package.json'));
        EXTENSION_PUBLISHER = publisher;
        EXTENSION_NAME = name;
    }

    export async function initConfiguration(config: RhamtConfiguration, modelService: ModelService): Promise<void> {

        await window.withProgress({
            location: ProgressLocation.Notification,
            cancellable: false
        }, async (progress: any) => {

            progress.report({message: 'Verifying JAVA_HOME'});
            let javaHome: string;
            let rhamtCli: string;

            try {
                javaHome = await findJavaHome();
            }
            catch (error) {
                promptForFAQs('Unable to resolve Java Home');
                progress.report({message: 'Unable to verify JAVA_HOME'});
                return Promise.reject(error);
            }

            progress.report({message: 'Verifying mta-cli'});

            try {
                rhamtCli = await cliResolver.findRhamtCli(modelService.outDir);
                console.log(`Using MTA CLI - ${rhamtCli}`);
            }
            catch (error) {
                promptForFAQs('Unable to find mta-cli executable', {outDir: modelService.outDir});
                return Promise.reject(error);
            }

            try {
                const version = await findRhamtVersion(rhamtCli, javaHome);
                console.log(`Using MTA version - ${version}`);
            }
            catch (error) {
                promptForFAQs('Unable to determine mta-cli version: \n' + error.message, {outDir: modelService.outDir});
                return Promise.reject(error);
            }

            config.rhamtExecutable = rhamtCli;
            config.options['jvm'] = javaHome;
            return config;
        });
    }

    export function findJavaHome(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            findJava((err: string, home: string) => {
                if (err) {
                    const javaHome = workspace.getConfiguration('java').get<string>('home');
                    if (javaHome) {
                        resolve(javaHome);
                    }
                    else {
                        reject(err);
                    }
                } else {
                    resolve(home);
                }
            });
        });
    }

    export function findRhamtVersion(rhamtCli: string, javaHome: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            const env = {JAVA_HOME : javaHome};
            const execOptions: child_process.ExecOptions = {
                env: Object.assign({}, process.env, env)
            };
            child_process.exec(
                `"${rhamtCli}" --version`, execOptions, (error: Error, _stdout: string, _stderr: string): void => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(parseVersion(_stdout));
                    }
                });
        });
    }

    function parseVersion(raw: string): string {
        return raw.replace(RHAMT_VERSION_REGEX, '');
    }

    export function getExtensionId(): string {
        return `${EXTENSION_PUBLISHER}.${EXTENSION_NAME}`;
    }

    export function getPathToExtensionRoot(...args: string[]): string {
        return path.join(extensions.getExtension(getExtensionId())!.extensionPath, ...args);
    }

    export async function checkCli(dataOut: string, context: ExtensionContext): Promise<any> {
        await cliResolver.findRhamtCli(dataOut).catch(() => {
            if (!context.workspaceState.get(IGNORE_RHAMT_DOWNLOAD)) {
                Utils.showDownloadCliOption(dataOut, context);
            }
        });
    }

    export async function showDownloadCliOption(dataOut: string, context: ExtensionContext): Promise<any> {
        const MSG = 'Unable to find MTA CLI';
        const OPTION_DOWNLOAD = 'Download';
        const OPTION_DISMISS = `Don't Show Again`;
        const choice = await window.showInformationMessage(MSG, OPTION_DOWNLOAD, OPTION_DISMISS);
        if (choice === OPTION_DOWNLOAD) {
            Utils.downloadCli(dataOut);
        }
        else if (choice === OPTION_DISMISS) {
            context.workspaceState.update(IGNORE_RHAMT_DOWNLOAD, true);
        }
    }

    export async function downloadCli(dataOut: string): Promise<any> {
        const handler = { log: msg => console.log(`mta-cli download message: ${msg}`) };
        const out = path.resolve(dataOut, 'mta-cli');
        RhamtInstaller.installCli(PREVIEW_DOWNLOAD_CLI_LOCATION, out, handler).then(async () => {
            window.showInformationMessage('mta-cli download complete');
            const home = cliResolver.findRhamtCliDownload(dataOut);
            const cli = cliResolver.getRhamtExecutable(home);
            if (fse.existsSync(cli)) {
                await fse.chmod(cli, '0764');
            }
            workspace.getConfiguration().update('mta.executable.path', cli);
        }).catch(e => {
            console.log(e);
            window.showErrorMessage(`Error downloading mta-cli: ${e}`);
        });
    }

    // const PREVIEW_DOWNLOAD_CLI_LOCATION = 'https://github.com/johnsteele/windup/releases/download/v0.0.4-alpha/rhamt-cli-4.3.2-SNAPSHOT-offline.zip';
}
