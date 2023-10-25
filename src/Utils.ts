/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { ExtensionContext, extensions, window, ProgressLocation } from 'vscode';
import * as path from 'path';
import * as fse from 'fs-extra';
import { RhamtConfiguration } from './server/analyzerModel';
import { ModelService } from './model/modelService';
import * as cliResolver from './util/cli-resolver';

import { rhamtChannel } from './util/console';

export namespace Utils {

    export let EXTENSION_PUBLISHER: string;
    export let EXTENSION_NAME: string;

    export async function loadPackageInfo(context: ExtensionContext): Promise<void> {
        const { publisher, name } = await fse.readJSON(context.asAbsolutePath('./package.json'));
        EXTENSION_PUBLISHER = publisher;
        EXTENSION_NAME = name;
    }

    export async function initConfiguration(config: RhamtConfiguration, modelService: ModelService): Promise<void> {

        await window.withProgress({
            location: ProgressLocation.Notification,
            cancellable: false
        }, async (progress: any) => {
            let rhamtCli = '';
            try {
                rhamtCli = await resolveCli(modelService, config);
            }
            catch (e) {
                return Promise.reject(e);
            }
            config.rhamtExecutable = rhamtCli;
            return config;
        });
    }

    export async function resolveCli(modelService: ModelService, config: RhamtConfiguration): Promise<string> {
        let rhamtCli = '';
        try {
            rhamtCli = await cliResolver.findRhamtCli(modelService.outDir, config);
            console.log(`Using CLI - ${rhamtCli}`);
        }
        catch (error) {
            return Promise.reject({error, notified: true});
        }
        rhamtChannel.print(`Using CLI: ${rhamtCli}`);
        rhamtChannel.print('\n');
        return rhamtCli;
    }

    export function getExtensionId(): string {
        return `${EXTENSION_PUBLISHER}.${EXTENSION_NAME}`;
    }

    export function getPathToExtensionRoot(...args: string[]): string {
        return path.join(extensions.getExtension(getExtensionId())!.extensionPath, ...args);
    }
}
