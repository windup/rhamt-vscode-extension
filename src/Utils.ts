'use strict';

import { ExtensionContext, workspace, extensions, window, Uri, commands, ProgressLocation } from 'vscode';
import * as fse from 'fs-extra';
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
            let rhamtExecutable: string;

            try {
                javaHome = await findJavaHome();
            }
            catch (error) {
                promptForFAQs('Unable to resolve Java Home');
                progress.report({message: 'Unable to verify JAVA_HOME'});
                return Promise.reject();
            }

            progress.report({message: 'Verifying windup-web'});

            try {
                rhamtExecutable = await findRhamtExecutable();
            }
            catch (error) {
                promptForFAQs('Unable to find windup-web executable');
                progress.report({message: 'Unable to find windup-web executable'});
                return Promise.reject();
            }
            config.rhamtExecutable = rhamtExecutable;
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

    export function findRhamtExecutable(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            const rhamtPath = workspace.getConfiguration('rhamt.executable').get<string>('path');
            if (rhamtPath) {
                resolve(rhamtPath);
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