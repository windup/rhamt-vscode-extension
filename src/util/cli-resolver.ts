/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { RhamtConfiguration } from '../server/analyzerModel';

export function findRhamtCli(outDir: string, config?: RhamtConfiguration): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        if (config) {
            const configCli = config.options['cli'] as string;
            if (configCli) {
                return resolve(configCli.trim());
            }
        }
        reject('Unable to find cli');
    });
}
