
export class RhamtModel {

    public configurations: Map<string, RhamtConfiguration> = new Map<string, RhamtConfiguration>();

    public getConfigurations(): RhamtConfiguration[] {
        return Array.from(this.configurations.values());
    }

    public exists(name: string): boolean {
        for (const config of this.getConfigurations()) {
            if (config.name === name) {
                return true;
            }
        }
        return false;
    }
}

export namespace AnalysisState {
    export const ANALYZING = 0;
    export const STOPPED = 1;
    export const COMPLETED = 2;
}

export namespace ChangeType {
    export const MODIFIED = 0;
    export const ADDED    = 1;
    export const DELETED  = 2;
    export const PROGRESS = 3;
    export const CANCELLED = 4;
    export const ERROR = 5;
    export const COMPLETE = 6;
    export const STARTED = 7;
    export const CLONING = 8;
}

export interface CloneUpdate {
    readonly input: Clone;
    readonly value: number;
    readonly title: string;
    readonly description?: string;
}

export interface Input {
    id: string;
    path: string;
}

export interface Clone extends Input {
    repo: string;
    starting: boolean;
    cloning: boolean;
    cancelled: boolean;
    completed: boolean;
}

export class RhamtConfiguration {
    id: string;
    name: string;
    report: string;
    rhamtExecutable: string;
    options: { [index: string]: any } = {};
    results: any;
}

export interface Hint {
    text: string;
    file: string;
}

export interface Classification {
    text: string;
    file: string;
}