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

    constructor(configuration: RhamtConfiguration, endpoints: Endpoints, context: ExtensionContext) {
        this.configuration = configuration;
        this.endpoints = endpoints;
        this.context = context;
    }

    open(): void {
        if (!this.view) {
            this.view = window.createWebviewPanel('rhamtConfigurationEditor', this.configuration.options['name'], ViewColumn.Active, {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [Uri.file(path.join(this.context.extensionPath, 'out'))]
            });
            this.view.onDidDispose(() => {
                this.view = undefined;
                this.onEditorClosed.emit(undefined);
            });
            this.view.webview.html = this.render();
        }
        this.view.reveal();
    }

    render(): string {
        return this.renderBody();
    }

    private renderBody(): string {
        const html = `
            <!DOCTYPE html>
            <html>
                <body style="margin:0px;padding:0px;overflow:hidden">
                    <iframe src="${this.endpoints.configurationLocation(this.configuration)}"
                        frameborder="0" style="overflow:hidden;overflow-x:hidden;overflow-y:hidden;height:100%;width:100%;position:absolute;top:0px;left:0px;right:0px;bottom:0px" height="100%" width="100%"></iframe>
                </body>
            </html>
        `;
        return html;
    }
}