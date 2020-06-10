/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';
import * as path from 'path';
import { RhamtConfiguration } from '../model/model';

async function getHost(port: string): Promise<string> {
    if (!process.env.CHE_WORKSPACE_NAMESPACE) {
        return `http://localhost:${port}/`;
    }
    const workspace = await require('@eclipse-che/plugin').workspace.getCurrentWorkspace();
    const runtimeMachines = workspace!.runtime!.machines || {};
    for (let machineName of Object.keys(runtimeMachines)) {
        const machineServers = runtimeMachines[machineName].servers || {};
        if (String(machineName).includes('rhamt')) {
            for (let serverName of Object.keys(machineServers)) {
                const url = machineServers[serverName].url!;
                const portNumber = machineServers[serverName].attributes.port!;
                if (String(portNumber) === port) {
                    return url;
                }
            }
        }
    }
    return undefined;
}

export async function getEndpoints(ctx: vscode.ExtensionContext, out: string): Promise<any> {
    const configurationPort = () => {
        return process.env.RHAMT_CONFIGURATION_PORT || String(61436);
    };
    const findConfigurationLocation = async () => {
        let location = process.env.RHAMT_CONFIGURATION_LOCATION;
        if (!location) {
            location = await getHost(configurationPort());
            process.env.RHAMT_CONFIGURATION_LOCATION = location;
        }
        return location;
    };
    const reportPort = () => {
        return process.env.RHAMT_REPORT_PORT || String(61435);
    };
    const reportLocation = async () => {
        let location = process.env.RHAMT_REPORT_LOCATION;
        if (!location) {
            location = await getHost(reportPort());
            if (!location.endsWith('/')) {
                location = `${location}/`;
            }
            process.env.RHAMT_REPORT_LOCATION = location;
        }
        if (!location) {
            console.error(`unable to find report location.`);
        }
        return location;
    };
    return {
        reportPort,
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
        configurationPort,
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