/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Utils } from "../Utils";
import * as vscode from 'vscode';
import * as open from 'opn';

export async function promptForFAQs(message: string, downloadCli?: { outDir: string }): Promise<any> {
    const DOWNLOAD = 'Download';
    const options = [];
    if (downloadCli) {
        options.push(DOWNLOAD);
    }
    const OPTION_SHOW_FAQS = 'Show FAQs';
    const OPTION_OPEN_SETTINGS = 'Open Settings';
    options.push(OPTION_SHOW_FAQS, OPTION_OPEN_SETTINGS);
    const choiceForDetails = await vscode.window.showErrorMessage(message, ...options);
    if (choiceForDetails === DOWNLOAD) {
        if (Utils.PRODUCT_THEME === 'mta' || Utils.PRODUCT_THEME === 'mtr') {
            open('https://developers.redhat.com/products/mta/download');
        }
        else {
            Utils.downloadCli(downloadCli.outDir);
        }
    }
    if (choiceForDetails === OPTION_SHOW_FAQS) {
        const faqPath: string = Utils.getPathToExtensionRoot('FAQ.md');
        vscode.commands.executeCommand('markdown.showPreview', vscode.Uri.file(faqPath));
    }
    else if (choiceForDetails === OPTION_OPEN_SETTINGS) {
        vscode.commands.executeCommand('workbench.action.openSettings', 'cli.executable.path');
    }
}
