import * as vscode from "vscode";
import { ExtensionContext, workspace, extensions } from 'vscode';
import * as fse from "fs-extra";
import * as child_process from "child_process";
import * as path from "path";

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
            const env: {} = getJavaHome();
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
        });
    }

    export function getJavaHome(): {} {
        let javaHome = workspace.getConfiguration("java").get<string>("home");
        if (javaHome) {
            return { JAVA_HOME: javaHome };
        } else if (process.env['JAVA_HOME']) {
            return { JAVA_HOME: process.env['JAVA_HOME'] };
        }
        return {};
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
            console.error("Unable to execute the rhamt-cli.");
            showRhamtExecutionError(error.message);
            return false;
        }
        return true;
    }

    export async function showRhamtExecutionError(message: string) {
        const OPTION_SHOW_DETAILS: string = "Show details";
        const OPTION_GUIDE: string = "Guidance";
        const choiceForDetails = await vscode.window.showErrorMessage("Unable to execute rhamt-cli commands. Please make sure that 'rhamt.executable.path' is pointed to its installed location. Also make sure JAVA_HOME is specified either in environment variables or settings.", OPTION_SHOW_DETAILS);
        if (choiceForDetails === OPTION_SHOW_DETAILS) {
            const choiceForGuide = await vscode.window.showErrorMessage(message, OPTION_GUIDE);
            if (choiceForGuide === OPTION_GUIDE) {
                // open FAQ
                const faqPath: string = Utils.getPathToExtensionRoot("FAQ.md");
                vscode.commands.executeCommand("markdown.showPreview", vscode.Uri.file(faqPath));
            }
        }
    }

    export function getExtensionId(): string {
        return `${EXTENSION_PUBLISHER}.${EXTENSION_NAME}`;
    }

    export function getPathToExtensionRoot(...args: string[]): string {
        return path.join(extensions.getExtension(getExtensionId())!.extensionPath, ...args);
    }
}