/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';
import * as path from 'path';
import { RhamtConfiguration } from '../server/analyzerModel';

const CONFIG_PORT = String(61436);
const REPORT_PORT = String(61435);

export interface RhamtHostInfo {
    configurationPort: string;
    configurationUrl: string;
    reportPort: string;
    reportUrl: string;
}

export async function getEndpoints(ctx: vscode.ExtensionContext): Promise<any> {
    const findConfigurationLocation = async () => {
        return `http://localhost:${CONFIG_PORT}/`;
    };
    const reportLocation = async () => {
        return `http://localhost:${REPORT_PORT}/`;
    };
    return {
        reportPort: () => REPORT_PORT,
        reportLocation,
        resourcesRoot: () => {
            return vscode.Uri.file(path.join(ctx.extensionPath, 'resources')).fsPath;
        },
        configurationResourceRoot: () => {
            return vscode.Uri.file(path.join(ctx.extensionPath, 'resources', 'configuration-editor')).fsPath;
        },
        configurationPort: () => CONFIG_PORT,
        configurationLocation: async (config?: RhamtConfiguration): Promise<string> => {
            let location = await findConfigurationLocation();
            if (!location) {
                console.error(`unable to find configuration location.`);
            }
            if (config) {
                if (!location.endsWith('/')) {
                    location = `${location}/`;
                }
                location = `${location}${config.id}`;
            }
            return location;
        }
    };
}