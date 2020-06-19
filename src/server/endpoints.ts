/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';
import * as path from 'path';
import { RhamtConfiguration } from '../model/model';

const CONFIG_PORT = String(61436);
const REPORT_PORT = String(61435);

export interface RhamtHostInfo {
    configurationPort: string;
    configurationUrl: string;
    reportPort: string;
    reportUrl: string;
}

async function computeCheHostInfo(): Promise<RhamtHostInfo> {

    const info: RhamtHostInfo = {
        configurationPort: CONFIG_PORT,
        configurationUrl: '',
        reportPort: REPORT_PORT,
        reportUrl: '',
    };

    let configurationUrl = process.env.RHAMT_CONFIGURATION_URL;
    let reportUrl = process.env.RHAMT_REPORT_URL;
    
    if (configurationUrl && reportUrl) {
        info.configurationUrl = configurationUrl;
        info.reportUrl = reportUrl;
        return info;
    }

    const workspace = await require('@eclipse-che/plugin').workspace.getCurrentWorkspace();
    const runtimeMachines = workspace!.runtime!.machines || {};
    for (let machineName of Object.keys(runtimeMachines)) {
        const machineServers = runtimeMachines[machineName].servers || {};
        if (String(machineName).includes('rhamt')) {
            for (let serverName of Object.keys(machineServers)) {
                let url = machineServers[serverName].url!;
                const portNumber = machineServers[serverName].attributes.port!;
                const port = String(portNumber);
                if (!url.endsWith('/')) {
                    url = `${url}/`;
                }
                if (port === info.configurationPort) {
                    info.configurationUrl = process.env.RHAMT_CONFIGURATION_URL = url;
                }
                else if (port === info.reportPort) {
                    info.reportUrl = process.env.RHAMT_REPORT_URL = url;
                }
                if (info.configurationUrl && info.reportUrl) {
                    console.log(`Finished computing endpoints`);
                    console.log(`configurationUrl: ${info.configurationUrl}`);
                    console.log(`reportUrl: ${info.reportUrl}`);
                    return info;
                }
            }
        }
    }
    return undefined;
}

export async function getEndpoints(ctx: vscode.ExtensionContext, out: string): Promise<any> {
    const findConfigurationLocation = async () => {
        if (!process.env.CHE_WORKSPACE_NAMESPACE) {
            return `http://localhost:${CONFIG_PORT}/`;
        }
        const info = await computeCheHostInfo();
        return info.configurationUrl;
    };
    const reportLocation = async () => {
        if (!process.env.CHE_WORKSPACE_NAMESPACE) {
            return `http://localhost:${REPORT_PORT}/`;
        }
        const info = await computeCheHostInfo();
        return info.reportUrl;
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
        reportsRoot: () => {
            return out;
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