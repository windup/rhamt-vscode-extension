/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';

class RhamtChannelImpl {
    private readonly channel: vscode.OutputChannel = vscode.window.createOutputChannel('RHAMT');
    print(text: string) {
        this.channel.append(text);
        this.channel.show();
    }
    clear() {
        this.channel.clear();
    }
}

export const rhamtChannel = new RhamtChannelImpl();
