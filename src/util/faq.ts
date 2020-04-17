import { Utils } from "../Utils";
import * as vscode from 'vscode';

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
        Utils.downloadCli(downloadCli.outDir);
    }
    if (choiceForDetails === OPTION_SHOW_FAQS) {
        const faqPath: string = Utils.getPathToExtensionRoot('FAQ.md');
        vscode.commands.executeCommand('markdown.showPreview', vscode.Uri.file(faqPath));
    }
    else if (choiceForDetails === OPTION_OPEN_SETTINGS) {
        vscode.commands.executeCommand('workbench.action.openSettings');
    }
}