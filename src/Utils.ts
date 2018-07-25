'use strict';

import * as vscode from "vscode";
import { ExtensionContext, workspace, extensions } from 'vscode';
import * as fse from "fs-extra";
import * as child_process from "child_process";
import * as path from "path";
import { ServerConfiguration } from "./rhamtService/main";
import * as net from "net";

const RHAMT_VERSION_REGEX = /^version /;

const findJava = require('find-java-home');

export namespace Utils {

    let EXTENSION_PUBLISHER: string;
    let EXTENSION_NAME: string;

    export async function loadPackageInfo(context: ExtensionContext): Promise<void> {
        const { publisher, name } = await fse.readJSON(context.asAbsolutePath("./package.json"));
        EXTENSION_PUBLISHER = publisher;
        EXTENSION_NAME = name;
    }

    export async function createConfiguration(): Promise<ServerConfiguration> {
        let javaHome: string;
        let rhamtCli: string;
        let port: number = 8080;

        try {
            javaHome = await findJavaHome();
        }
        catch (error) {
            promptForFAQs('Unable to resolve Java Home');
            return Promise.reject();
        }

        try {
            rhamtCli = await findRhamtCli();
        }
        catch (error) {
            promptForFAQs('Unable to find rhamt-cli executable');
            return Promise.reject();
        }

        try {
            await findRhamtVersion(rhamtCli, javaHome);
        }
        catch (error) {
            promptForFAQs('Unable to determine rhamt-cli version: \n' + error.message);
            return Promise.reject();
        }

        try {
            await validatePort(port);
        }
        catch (error) {
            promptForFAQs(error.message);
            return Promise.reject();
        }

        return new ServerConfiguration(rhamtCli, port, javaHome);
    }

    export function findRhamtVersion(rhamtCli: string, javaHome: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            let env = {'JAVA_HOME' : javaHome};
            const execOptions: child_process.ExecOptions = {
                env: Object.assign({}, process.env, env)
            };
            child_process.exec(
                `${rhamtCli} --version`, execOptions, (error: Error, _stdout: string, _stderr: string): void => {
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

    export function findJavaHome(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            findJava((err: string, home: string) => {
                if (err) {
                    let javaHome = workspace.getConfiguration("java").get<string>("home");
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
            let rhamtPath = workspace.getConfiguration("rhamt.executable").get<string>("path");
            if (rhamtPath) {
                resolve(rhamtPath);
            }
    
            let rhamtHome = process.env['RHAMT_HOME'];
            if (rhamtHome) {
                let isWindows = process.platform === 'win32';
                resolve(path.join(rhamtHome, "bin", "rhamt-cli" +  isWindows ? ".bat" : ""));
            }       
            
            reject(new Error(""));
        });
    }

    export async function promptForFAQs(message: string): Promise<any> {
        const OPTION_SHOW_FAQS: string = "Show FAQs";
        const OPTION_OPEN_SETTINGS: string = "Open Settings";
        const choiceForDetails = await vscode.window.showErrorMessage(message, OPTION_OPEN_SETTINGS, OPTION_SHOW_FAQS);
        if (choiceForDetails === OPTION_SHOW_FAQS) {
            const faqPath: string = Utils.getPathToExtensionRoot("FAQ.md");
            vscode.commands.executeCommand("markdown.showPreview", vscode.Uri.file(faqPath));
        }
        else if (choiceForDetails === OPTION_OPEN_SETTINGS) {
            vscode.commands.executeCommand("workbench.action.openSettings");
        }
    }

    export function getExtensionId(): string {
        return `${EXTENSION_PUBLISHER}.${EXTENSION_NAME}`;
    }

    export function getPathToExtensionRoot(...args: string[]): string {
        return path.join(extensions.getExtension(getExtensionId())!.extensionPath, ...args);
    }

    export async function validatePort(port: number): Promise<void> {
        if (port < 1 || port > 65535) {
            throw new Error('Port value is incorrect.');
        }

        if (! await isPortFree(port)) {
            throw new Error('Port ' + port + ' is already in use.');
        }
    }

    export function isPortFree(port: number): Promise<boolean> {
        return new Promise(resolve => {
            const server = net.createServer();
            server.listen(port, '0.0.0.0');
            server.on('error', () => {
                resolve(false);
            });
            server.on('listening', () => {
                server.close();
                resolve(true);
            });
        });
    }
}