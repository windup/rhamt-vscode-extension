/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { rhamtEvents } from '../events';
import { WebviewPanel, window, ViewColumn, Uri, ExtensionContext } from 'vscode';
import * as path from 'path';
import { Endpoints, RhamtConfiguration } from '../model/model';

export class ConfigurationEditor {

    onEditorClosed = new rhamtEvents.TypedEvent<void>();

    private configuration: RhamtConfiguration;
    private view: WebviewPanel | undefined = undefined;
    private endpoints: Endpoints;
    private context: ExtensionContext;

    constructor(configuration: RhamtConfiguration, endpoints: Endpoints, context: ExtensionContext, webview?: WebviewPanel) {
        this.configuration = configuration;
        this.endpoints = endpoints;
        this.context = context;
        if (webview) {
            this.view = webview;
            this.setupView();
        }
    }

    async open(): Promise<void> {
        if (!this.view) {
            this.view = window.createWebviewPanel('rhamtConfigurationEditor', this.configuration.name, ViewColumn.Active, {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [Uri.file(path.join(this.context.extensionPath, 'out'))]
            });
            this.setupView();
        }
    }

    private async setupView(): Promise<void> {
        this.view.onDidDispose(() => {
            this.view = undefined;
            this.onEditorClosed.emit(undefined);
        });
        const location = await this.endpoints.configurationLocation(this.configuration);
        this.view.webview.html = this.render(location);
        this.view.reveal();
    }

    async close() {
        if (this.view) {
            this.view.dispose();
        }
    }

    private render(location: string): string {
        return `
            <!DOCTYPE html>
            <html>
                <head>
                <meta http-equiv="Content-Security-Policy" content="">'
                <script>
                    (function () {
                        const vscode = acquireVsCodeApi();
                        vscode.setState({id: "${this.configuration.id}"});
                    }());
                </script>
                </head>
                <body style="margin:0px;padding:0px;overflow:hidden">
                    <iframe src="${location}"
                        frameborder="0" style="overflow:hidden;overflow-x:hidden;overflow-y:hidden;height:100%;width:100%;position:absolute;top:0px;left:0px;right:0px;bottom:0px" height="100%" width="100%"></iframe>
                </body>
            </html>
        `;
    }
}
