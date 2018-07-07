import { workspace } from 'vscode';
import * as path from "path";

export namespace Utils {

    export function getRhamtExecutable(): string {
        let rhamtPath = workspace.getConfiguration("rhamt.executable").get<string>("path");
        if (rhamtPath) {
            return `"${rhamtPath}"`;
        }

        rhamtPath = process.env['RHAMT_HOME'];
        if (rhamtPath) {
            return path.join(rhamtPath, "bin", "rhamt-cli");
        }
        
        return "";
    }
}