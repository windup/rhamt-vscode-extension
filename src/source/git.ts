import * as path from 'path';
import * as vscode from 'vscode';
const util = require('util');
const exec = util.promisify(require('child_process').exec);

export function init(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('rhamt.downloadGitRepo', async (data) => {
        const repo = data.repo;
        const folderName = data.folderName;
        const workspaceFolder = data.workspaceFolder;
        const result = {
            repo,
            workspaceFolder,
            folderName,
            configuration: data.config,
            error: false
        }
        try {
            const location = path.join(workspaceFolder, folderName);
            const { stdout, stderr } = await exec(`git clone --depth 1 ${repo} ${location}`);
            console.log(stdout);
            console.log(stderr);
        }
        catch (e) {
            result.error = true;
            if (e.message.includes('already exists and is not an empty directory')) {
                console.log(`Error cloning repo: ${e}`);
                console.log(`${folderName} already exists in workspace.`);
                // vscode.window.showInformationMessage(`${folderName} already exists in workspace.`);
            }   
            else {
                console.log(`Error cloning repo: ${e}`);
                vscode.window.showErrorMessage(e);
            }
        }
        return Promise.resolve(result);
    }));
}
