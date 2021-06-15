/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { rhamtEvents } from '../events';
import { WebviewPanel, window, ViewColumn, Uri, ExtensionContext } from 'vscode';
import * as path from 'path';
import { ChangeType, Endpoints, RhamtConfiguration } from '../model/model';

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
            try {
                this.view = window.createWebviewPanel('rhamtConfigurationEditor', this.configuration.name, ViewColumn.Active, {
                    enableScripts: true,
                    retainContextWhenHidden: false,
                    localResourceRoots: [Uri.file(path.join(this.context.extensionPath, 'out'))]
                });
            } catch (e) {
                console.log(`Error creating webview panel: ${e}`);
            }
            try {
                await this.setupView();
            } catch (e) {
                console.log(`Error at setupView: ${e}`);
            }
        }
        this.view.reveal();
    }

    updateTitle(title: string) {
        if (this.view) {
            this.view.title = title;
            this.view.reveal;
        }
    }

    private async setupView(): Promise<void> {
        const changeListener = change => {
            if (this.view) {
                if (change.type === ChangeType.MODIFIED && change.name === 'name') {
                    this.updateTitle(this.configuration.name);
                }
            }
        };
        this.configuration.onChanged.on(changeListener);
        this.view.onDidDispose(() => {
            this.view = undefined;
            this.configuration.onChanged.off(changeListener);
            this.onEditorClosed.emit(undefined);
        });
        const location = await this.endpoints.configurationLocation(this.configuration);
        console.log(`Rendering configuration editor at: ${location}`);
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
                <meta http-equiv="Content-Security-Policy" content="">
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
