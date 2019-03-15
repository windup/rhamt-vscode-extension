'use strict';

import { ExtensionContext, workspace, extensions, window, Uri, commands, ProgressLocation } from 'vscode';
import * as fse from 'fs-extra';
import * as child_process from 'child_process';
import * as path from 'path';
import { RhamtConfiguration } from './model/model';

const findJava = require('find-java-home');

export namespace Utils {

    let EXTENSION_PUBLISHER: string;
    let EXTENSION_NAME: string;

    export async function loadPackageInfo(context: ExtensionContext): Promise<void> {
        const { publisher, name } = await fse.readJSON(context.asAbsolutePath('./package.json'));
        EXTENSION_PUBLISHER = publisher;
        EXTENSION_NAME = name;
    }

    export async function initConfiguration(config: RhamtConfiguration) {

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
                return Promise.reject();
            }

            progress.report({message: 'Verifying rhamt-cli'});

            try {
                rhamtCli = await findRhamtCli();
            }
            catch (error) {
                promptForFAQs('Unable to find rhamt-cli executable');
                progress.report({message: 'Unable to find rhamt-cli executable'});
                return Promise.reject();
            }

            try {
                await findRhamtVersion(rhamtCli, javaHome);
            }
            catch (error) {
                promptForFAQs('Unable to determine rhamt-cli version: \n' + error.message);
                progress.report({message: 'Unable to verify rhamt-cli executable'});
                return Promise.reject();
            }

            config.options['cli'] = rhamtCli;
            config.options['jvm'] = javaHome;
            return config;
        });
    }

    export function findRhamtVersion(rhamtCli: string, javaHome: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            const env = {JAVA_HOME : javaHome};
            const execOptions: child_process.ExecOptions = {
                env: Object.assign({}, process.env, env)
            };
            child_process.exec(
                `${rhamtCli} --version`, execOptions, (error: Error, _stdout: string, _stderr: string): void => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }
                });
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

    export function findRhamtCli(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            const rhamtPath = workspace.getConfiguration('rhamt.executable').get<string>('path');
            if (rhamtPath) {
                resolve(rhamtPath);
            }
            const rhamtHome = process.env['RHAMT_HOME'];
            if (rhamtHome) {
                const isWindows = process.platform === 'win32';
                resolve(path.join(rhamtHome, 'bin', 'rhamt-cli' +  isWindows ? '.bat' : ''));
            }
            reject(new Error(''));
        });
    }

    export async function promptForFAQs(message: string): Promise<any> {
        const OPTION_SHOW_FAQS = 'Show FAQs';
        const OPTION_OPEN_SETTINGS = 'Open Settings';
        const choiceForDetails = await window.showErrorMessage(message, OPTION_OPEN_SETTINGS, OPTION_SHOW_FAQS);
        if (choiceForDetails === OPTION_SHOW_FAQS) {
            const faqPath: string = Utils.getPathToExtensionRoot('FAQ.md');
            commands.executeCommand('markdown.showPreview', Uri.file(faqPath));
        }
        else if (choiceForDetails === OPTION_OPEN_SETTINGS) {
            commands.executeCommand('workbench.action.openSettings');
        }
    }

    export function getExtensionId(): string {
        return `${EXTENSION_PUBLISHER}.${EXTENSION_NAME}`;
    }

    export function getPathToExtensionRoot(...args: string[]): string {
        return path.join(extensions.getExtension(getExtensionId())!.extensionPath, ...args);
    }
}