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

import { rhamtChannel } from './util/console';
import { Windup } from './extension';

import * as open from 'opn';

const RHAMT_VERSION_REGEX = /^version /;

const findJava = require('find-java-home');

const IGNORE_RHAMT_DOWNLOAD = 'ignoreRhamtDownload';

export namespace Utils {

    export const MTR_DOWNLOAD_CLI_PRODUCT_PAGE = "https://developers.redhat.com/products/mtr/overview";

    export let PRODUCT_THEME: string;
    export let CLI_SCRIPT: string;
    export let CLI_VERSION: string;
    export let CLI_FOLDER: string;
    export let DOWNLOAD_CLI_LOCATION: string;

    export let EXTENSION_PUBLISHER: string;
    export let EXTENSION_NAME: string;

    export async function loadPackageInfo(context: ExtensionContext): Promise<void> {
        const { publisher, name } = await fse.readJSON(context.asAbsolutePath('./package.json'));
        EXTENSION_PUBLISHER = publisher;
        EXTENSION_NAME = name;
        DOWNLOAD_CLI_LOCATION = "https://developers.redhat.com/products/mta/download"; // "https://repo1.maven.org/maven2/org/jboss/windup/windup-cli/6.1.0.Final/windup-cli-6.1.0.Final-no-index.zip"; // "https://repo1.maven.org/maven2/org/jboss/windup/windup-cli/6.2.0.Alpha2/windup-cli-6.2.0.Alpha2-no-index.zip"; // "https://repo1.maven.org/maven2/org/jboss/windup/windup-cli/6.1.7.Final/windup-cli-6.1.7.Final-no-index.zip"; //; // MTR_DOWNLOAD_CLI_PRODUCT_PAGE;
        CLI_SCRIPT = "mta-cli";
        CLI_FOLDER = "mta-cli-6.1.0.Final";
        PRODUCT_THEME = "mta";
    }

    export async function initConfiguration(config: RhamtConfiguration, modelService: ModelService): Promise<void> {

        await window.withProgress({
            location: ProgressLocation.Notification,
            cancellable: false
        }, async (progress: any) => {

            // progress.report({message: 'Verifying JAVA_HOME'});
            let javaHome: string;
            let rhamtCli: string;

            try {
                javaHome = await findJavaHome(config);
            }
            catch (error) {
                promptForFAQs('Unable to resolve Java Home');
                progress.report({message: 'Unable to verify JAVA_HOME'});
                return Promise.reject(error);
            }

            console.log('Using JAVA_HOME');
            console.log(javaHome);
            rhamtChannel.clear();

            // progress.report({message: 'Verifying cli'});

            try {
                rhamtCli = await resolveCli(modelService, config, javaHome);
            }
            catch (e) {
                console.log(e);
                promptForFAQs('Unable to determin cli version', {outDir: modelService.outDir});
                return Promise.reject(e);
            }
            config.rhamtExecutable = rhamtCli;
            config.options['jvm'] = javaHome;
            return config;
        });
    }

    export async function resolveCli(modelService: ModelService, config: RhamtConfiguration, javaHome: string): Promise<string> {
        let rhamtCli = '';
        try {
            rhamtCli = await cliResolver.findRhamtCli(modelService.outDir, config);
            console.log(`Using CLI - ${rhamtCli}`);
        }
        catch (error) {
            console.log('Error finding rhamtCli');
            console.log(error);
            // promptForFAQs('Unable to find cli executable', {outDir: modelService.outDir});
            return Promise.reject({error, notified: true});
        }
        rhamtChannel.print(`Using CLI: ${rhamtCli}`);
        rhamtChannel.print('\n');
        try {
            console.log(`attempt verify cli --version`);
            // const version = await findRhamtVersion(rhamtCli, javaHome);
            // console.log(`Using version - ${version}`);
        }
        catch (error) {
            console.log('Failed to verify CLI using --version');
            console.log(error);
            window.showErrorMessage(error);
            // promptForFAQs('Unable to determine cli version: \n' + error.message, {outDir: modelService.outDir});
            return Promise.reject(error);
        }
        console.log('cli resolved: ' + rhamtCli);
        return rhamtCli;
    }

    export function findJavaHome(config: RhamtConfiguration): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            const javaHomePreference = config.options['JAVA_HOME'];
            if (javaHomePreference) {
                resolve(javaHomePreference);
            }
            else {
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
            }
        });
    }

    export function findRhamtVersion(rhamtCli: string, javaHome: string): Promise<string> {
        console.log(`Verifying CLI Version: using CLI --> ${rhamtCli}`);
        console.log(`Verifying JAVA_HOME: --> ${javaHome}`);
        return new Promise<string>((resolve, reject) => {
            const env = {JAVA_HOME : javaHome};
            const execOptions: child_process.ExecOptions = {
                env: Object.assign({}, process.env, env)
            };
            console.log(execOptions.env);

            rhamtChannel.print(`Using JAVA_HOME: ${execOptions.env.JAVA_HOME}`);
            rhamtChannel.print('\n');
            
            child_process.exec(
                `"${rhamtCli}" --version`, execOptions, (error: Error, _stdout: string, _stderr: string): void => {
                    if (error) {
                        console.log(`error while executing --version`);
                        rhamtChannel.print(`error while executing --version`);
                        rhamtChannel.print('\n');
                        rhamtChannel.print(_stdout);
                        console.log(error);
                        console.log('stdout');
                        console.log(_stdout);
                        console.log('stderr');
                        console.log(_stderr);
                        return reject(error);
                    } else {
                        console.log('success --version:');
                        console.log(_stdout);
                        console.log(`parsing version`);
                        rhamtChannel.print('\n');
                        rhamtChannel.print(_stdout);
                        return resolve(parseVersion(_stdout));
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

    export async function checkCli(dataOut: string, context: ExtensionContext, autoDownload?: boolean): Promise<any> {
        await cliResolver.findRhamtCli(dataOut).catch(() => {
            if (Utils.PRODUCT_THEME === 'mta' || Utils.PRODUCT_THEME === 'mtr') {
                Utils.showDownloadCliOption(dataOut, context);
            }
            else if (autoDownload || Windup.isRemote()) {
                console.log('Auto-downloading CLI...');
                Utils.downloadCli(dataOut);
            }
            else if (!context.workspaceState.get(IGNORE_RHAMT_DOWNLOAD)) {
                Utils.showDownloadCliOption(dataOut, context);
            }
        });
    }

    export async function showDownloadCliOption(dataOut: string, context: ExtensionContext): Promise<any> {
        const MSG = 'Unable to find CLI';
        const OPTION_DOWNLOAD = 'Download';
        const OPTION_DISMISS = `Don't Show Again`;
        const choice = await window.showInformationMessage(MSG, OPTION_DOWNLOAD, OPTION_DISMISS);
        if (choice === OPTION_DOWNLOAD) {
            if (Utils.PRODUCT_THEME === 'mta') {
                open('https://developers.redhat.com/products/mta/download');
            }
            else if (Utils.PRODUCT_THEME === 'mtr') {
                open('https://developers.redhat.com/products/mtr/download');
            }
            else {
                Utils.downloadCli(dataOut);
            }
        }
        else if (choice === OPTION_DISMISS) {
            context.workspaceState.update(IGNORE_RHAMT_DOWNLOAD, true);
        }
    }

    export async function downloadCli(dataOut: string): Promise<any> {
        const handler = { log: msg => console.log(`cli download message: ${msg}`) };
        const out = dataOut; // path.resolve(dataOut, 'cli');
        RhamtInstaller.installCli(Utils.DOWNLOAD_CLI_LOCATION, out, handler).then(async () => {
            window.showInformationMessage('Download Complete');
            const home = cliResolver.findRhamtCliDownload(dataOut);
            const cli = cliResolver.getDownloadExecutableName(home);
            try {
                await fse.chmod(cli, '0764');
            }
            catch (error) {
                console.log('Error chmod of cli');
                console.log('CLI exists on filesystem: ' + fse.existsSync(cli));
                console.log(error);
                window.showErrorMessage('Error chmod of cli: ' + cli);
            }
            workspace.getConfiguration().update('cli.executable.path', cli);
        }).catch(e => {
            console.log(e);
            const error = e.value.e;
            if (error && error.cancelled) {
                window.showInformationMessage(`cli download cancelled.`);
            }
            else {
                window.showErrorMessage(`Error downloading cli: ${e}`);
            }
        });
    }
}
