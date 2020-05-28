/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as assert from 'assert';
import * as vscode from 'vscode';

suite("RHAMT Extension Tests", () => {

    test('Extension should be present', () => {
        assert.ok(vscode.extensions.getExtension('redhat.rhamt-vscode-extension'));
    });

    test('should activate', async () => {
        return vscode.extensions.getExtension('redhat.rhamt-vscode-extension')!.activate().then(() => {
            assert.ok(true);
        });
    });

    test('should register all commands', async () => {
        return vscode.commands.getCommands(true).then((commands) => {
            let cmds = commands.filter(cmd => cmd.startsWith('rhamt.'));
            assert.equal(cmds.length, 17, 'Some commands are not registered properly or a new command is not added to the test');
        });
    });
});