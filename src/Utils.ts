
import * as vscode from "vscode";
import { ExtensionContext, workspace, extensions } from 'vscode';
import * as fse from "fs-extra";
import * as child_process from "child_process";
import * as path from "path";
const findJava = require('find-java-home');

export namespace Utils {

    let EXTENSION_PUBLISHER: string;
    let EXTENSION_NAME: string;

    export async function loadPackageInfo(context: ExtensionContext): Promise<void> {
        const { publisher, name } = await fse.readJSON(context.asAbsolutePath("./package.json"));
        EXTENSION_PUBLISHER = publisher;
        EXTENSION_NAME = name;
    }

    export function getRhamtVersion(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            findJavaHome().then(javaHome => {
                let env = {'JAVA_HOME' : javaHome};
                const execOptions: child_process.ExecOptions = {
                    env: Object.assign({}, process.env, env)
                };
                child_process.exec(
                    `${getRhamtExecutable()} --version`, execOptions, (error: Error, _stdout: string, _stderr: string): void => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve();
                        }
                    });
            }).catch((error) => {
                reject(error);
            });
        });
    }

    export function findJavaHome(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            findJava((err: string, home: string) => {
                if (err) {
                    let javaHome = workspace.getConfiguration("java").get<string>("home");
                    if (javaHome) {
                        resolve(javaHome);
                    } else {
                        reject(err);
                    }
                } else {
                    resolve(home);
                }
            });
        });
    }

    export function getRhamtExecutable(): string {
        let rhamtPath = workspace.getConfiguration("rhamt.executable").get<string>("path");
        if (rhamtPath) {
            return `"${rhamtPath}"`;
        }

        let isWindows = process.platform == "win32";

        let rhamtHome = getRhamtHome();
        if (rhamtHome) {
            return path.join(rhamtHome, "bin", "rhamt-cli" +  isWindows ? ".bat" : "");
        }       
        
        return "";
    }

    export function getRhamtHome(): string {
        let home = process.env['RHAMT_HOME'];
        if (home) {
            return home;
        }
        return "";
    }

    export async function checkRhamtAvailablility(): Promise<boolean> {
        try {
            await getRhamtVersion();
        } catch (error) {
            console.error('Unable to start the rhamt-cli.');
            const OPTION_SHOW_FAQS: string = "Show FAQs";
            const MESSAGE_ERROR = "Unable to execute rhamt-cli."
            const OPTION_OPEN_SETTINGS: string = "Open Settings";
            //const OPTION_GUIDE: string = "Guidance";
            const choiceForDetails = await vscode.window.showErrorMessage(`${MESSAGE_ERROR}\nError:\n${error.message}`, OPTION_OPEN_SETTINGS, OPTION_SHOW_FAQS);
            if (choiceForDetails === OPTION_SHOW_FAQS) {
                const faqPath: string = Utils.getPathToExtensionRoot("FAQ.md");
                vscode.commands.executeCommand("markdown.showPreview", vscode.Uri.file(faqPath));
            }
            else if (choiceForDetails === OPTION_OPEN_SETTINGS) {
                vscode.commands.executeCommand("workbench.action.openSettings");
            }
            return false;
        }
        return true;
    }

    export async function showRhamtExecutionError(message: string) {
        
    }

    export function getExtensionId(): string {
        return `${EXTENSION_PUBLISHER}.${EXTENSION_NAME}`;
    }

    export function getPathToExtensionRoot(...args: string[]): string {
        return path.join(extensions.getExtension(getExtensionId())!.extensionPath, ...args);
    }
}