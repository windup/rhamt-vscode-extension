/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { window, ExtensionContext, commands} from 'vscode';
import * as open from 'opn';

export class ReportView {

    private context: ExtensionContext;

    constructor(context: ExtensionContext) {
        this.context = context;
        this.context.subscriptions.push(commands.registerCommand('rhamt.openReportExternal', async item => {
            this.openReport(item);
        }));
    }

    private async openReport(item: any): Promise<any> {
        let location = item.getReport() as string;
        if (!location) {
            return window.showErrorMessage(`Unable to find report on filesystem`);
        }
        await this.open(location);
    }

    async open(location: string): Promise<void> {
        open(location);
        return;
    }
}