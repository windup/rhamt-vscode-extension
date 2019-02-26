import * as vscode from 'vscode';
import { RhamtConfiguration } from './model/model';

const SOURCE = [
    "websphere",
    "jbpm",
    "soa",
    "seam",
    "eap7",
    "hibernate",
    "oraclejdk",
    "eap6",
    "rmi",
    "jrun",
    "glassfish",
    "java",
    "orion",
    "eap",
    "hibernate-search",
    "log4j",
    "soa-p",
    "rpc",
    "sonic",
    "weblogic",
    "drools",
    "java-ee",
    "javaee",
    "sonicesb",
    "jonas",
    "resin",
    "resteasy"
];

const TARGET = [
    "cloud-readiness",
    "jbpm",
    "drools",
    "fsw",
    "eap7",
    "hibernate",
    "java-ee",
    "eap6",
    "fuse",
    "openjdk",
    "eap",
    "camel",
    "linux",
    "hibernate-search",
    "resteasy"
];


export class OptionsBuilder {

    static async build(config: RhamtConfiguration): Promise<any> {

        const name = await vscode.window.showInputBox({
            prompt: "Configuration Name",
            validateInput: (value: string) => {
                if (value.trim().length === 0) {
                    return 'Configuration name required';
                }
            }
        });

        if (!name) return;
        config.options.set('name', name);

        const input = await vscode.window.showWorkspaceFolderPick({
            placeHolder: 'input folder'
        });

        if (!input) return;
        config.options.set('input', input.uri.fsPath);

        const output = await vscode.window.showInputBox({
            prompt: 'output folder',
            placeHolder: 'output',
            validateInput: (value: string) => {
                if (value.trim().length === 0) {
                    return 'Output folder is required';
                }
            }
        });

        if (!output) return;
        config.options.set('output', input.uri.fsPath);

        const source = await vscode.window.showQuickPick(SOURCE, {
            canPickMany: true,
            placeHolder: 'source (the source server/technology/framework to migrate from)'
        });

        if (!source) return;
        config.options.set('source', source);

        const target = await vscode.window.showQuickPick(TARGET, {
            canPickMany: true,
            placeHolder: 'target (the target server/technology/framework to migrate to)'
        });

        if (!target) return;
        config.options.set('target', target);

        return config;
    }
}