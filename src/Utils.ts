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

const PREVIEW_DOWNLOAD_CLI_LOCATION = 'https://oss.sonatype.org/content/repositories/snapshots/org/jboss/windup/rhamt-cli/4.3.2-SNAPSHOT/rhamt-cli-4.3.2-20200511.064139-57-offline.zip';
// const DOWNLOAD_CLI_LOCATION = `http://central.maven.org/maven2/org/jboss/windup/rhamt-cli/${RHAMT_VERSION}/${RHAMT_FOLDER}-offline.zip`;

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

            progress.report({message: 'Verifying rhamt-cli'});

            try {
                rhamtCli = await cliResolver.findRhamtCli(modelService.outDir);
                console.log(`Using RHAMT CLI - ${rhamtCli}`);
            }
            catch (error) {
                promptForFAQs('Unable to find rhamt-cli executable', {outDir: modelService.outDir});
                return Promise.reject(error);
            }

            try {
                await findRhamtVersion(rhamtCli, javaHome);
            }
            catch (error) {
                promptForFAQs('Unable to determine rhamt-cli version: \n' + error.message, {outDir: modelService.outDir});
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
        const MSG = 'Unable to find RHAMT CLI';
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
        const handler = { log: msg => console.log(`rhamt-cli download message: ${msg}`) };
        const out = path.resolve(dataOut, 'rhamt-cli');
        RhamtInstaller.installCli(PREVIEW_DOWNLOAD_CLI_LOCATION, out, handler).then(home => {
            window.showInformationMessage('rhamt-cli download complete');
            workspace.getConfiguration().update('rhamt.executable.path', cliResolver.getRhamtExecutable(home));
        }).catch(e => {
            console.log(e);
            window.showErrorMessage(`Error downloading rhamt-cli: ${e}`);
        });
    }

    // const PREVIEW_DOWNLOAD_CLI_LOCATION = 'https://github.com/johnsteele/windup/releases/download/v0.0.4-alpha/rhamt-cli-4.3.2-SNAPSHOT-offline.zip';
}
