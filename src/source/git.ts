import * as vscode from 'vscode';
const util = require('util');
const exec = util.promisify(require('child_process').exec);

export function init(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('rhamt.downloadGitRepo', async (data) => {
        const repo = '';
        const folderName = '';
        downloadRepo(repo, folderName);
    }));
}

export async function downloadRepo(repo: string, folderName: string): Promise<any> {
    try {
        console.log(`Downloading files from repo ${repo}`);
        await runCmd(`git clone --depth 1 ${repo} ${folderName}`);
        console.log('Cloned successfully.');
        console.log('');
    }
    catch (e) {
        console.log(e);
        // Notify user
        return Promise.resolve();
    }
    // Delete .git folder
    await runCmd('npx rimraf ./.git');
}

async function runCmd(command) {
  try {
    const { stdout, stderr } = await exec(command);
    console.log(stdout);
    console.log(stderr);
  } catch {
    (error) => {
      console.log(error);
    };
  }
}
