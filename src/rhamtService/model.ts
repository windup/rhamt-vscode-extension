'user strict';

export class  RhamtModel {
    configurations: Map<string, RhamtConfiguration> = new Map<string, RhamtConfiguration>();

    public getConfigurations(): RhamtConfiguration[] {
        return Array.from(this.configurations.values());
    }
}

export class RhamtConfiguration {
    name?: string;
    input?: string[];
    rhamtExecutable?: string;
    sourceMode?: boolean;
    outputLocation?: string;
    packages?: string[];
    timestamp?: string;
    migrationPath?: IMigrationPath;
    userRules?: string[];
    options?: IOption[];
    javaHome?: string;
    rhamtCli?: string;
    ignorePatterns?: IIgnorePattern[];
    executionResult?: IExecutionResult;
    reports?: IReport[];
}

export interface IExecutionResult {
    hints: IHint[];
    classifications: IClassification[];
}

export interface IIssue {
    quickfixes: IQuickFix[];
    file: string;
    severity: string;
    ruleId: string;
    effort: string;
    title: string;
    messageOrDescription: string;
    links: ILink[];
    report: string;
}

export interface IHint extends IIssue {
    originalLineSource: string;
    lineNumber: number;
    column: number;
    length: number;
    sourceSnippet: string;
}

export interface IClassification extends IIssue {    
}

export type IQuickFixType = 'REPLACE' | 'DELETE_LINE' | 'INSERT_LINE' | 'TRANSFORMATION';

export interface IQuickFix {
    type: IQuickFixType;
    searchString: string;
    replacementString: string;
    newLine: string;
    transformationId: string;
    name: string;
    file: string;
}

export interface ILink {
    description: string;
    url: string;
}

export interface IReport {
    inputFile: string;
    reportLocation: string;
}

export interface IMigrationPath {
    id: string;
    source: ITechnology;
    target: ITechnology;
}

export interface ITechnology {
    id: string;
    versionRange: string;
}

export interface IOption {
    name: string;
    value: string;
}

export interface IIgnorePattern {
    pattern: string;
    enabled: boolean;
}