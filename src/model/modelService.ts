/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { RhamtModel, RhamtConfiguration, Endpoints, IHint } from '../server/analyzerModel';
import * as fs from 'fs';
import * as path from 'path';
import * as fse from 'fs-extra';
import * as mkdirp from 'mkdirp';
import * as vscode from 'vscode';
import { AnalyzerUtil } from '../server/analyzerUtil';

export class ModelService {

    public loaded: boolean = false;
    private rulesets: string[] = [];
    elementData: any;

    constructor(
        public model: RhamtModel,
        public outDir: string,
        public endpoints: Endpoints) {
    }

    public addConfiguration(config: RhamtConfiguration): void  {
        this.model.configurations.push(config);
    }

    public getConfiguration(id: string): RhamtConfiguration | undefined {
        return this.model.configurations.find(config => config.id === id);
    }

    public getConfigurationWithName(name: string): RhamtConfiguration | undefined {
        return this.model.configurations.find(item => item.name === name);
    }

    public createConfiguration(): RhamtConfiguration {
        return this.createConfigurationWithName(this.generateConfigurationName());
    }

    public createConfigurationWithName(name: string): RhamtConfiguration {
        const config: RhamtConfiguration = new RhamtConfiguration();
        config.id = ModelService.generateUniqueId();
        config.name = name;
        config.options['output'] = path.resolve(this.outDir, config.id);
        try {
            const defaultInput = vscode.workspace!.workspaceFolders![0].uri.fsPath;
            config.options['input'] = [defaultInput];
        } catch (e) {
            // no-op
        }
        config.options['cli'] = this.getRecentCli();
        config.options['sourceMode'] = true;
        config.options['target'] = ['eap7'];
        config.options['legacyReports'] = true;

        return config;
    }

    public async deleteConfiguration(configuration: RhamtConfiguration): Promise<boolean> {
        const index = this.model.configurations.indexOf(configuration, 0);
        if (index > -1) {
            this.model.configurations.splice(index, 1);
            const output = configuration.options['output'];
            if (output) {
                this.deleteOuputLocation(output);
            }
            try {
                await this.save();
            }
            catch (e) {
                console.log(`Error saving configuration data: ${e}`);
            }
            return true;
        }
        return false;
    }

    public deleteOuputLocation(location: string) {
        fs.exists(location, exists => {
            if (exists) {
                fse.remove(location);
            }
        });
    }

    public async deleteConfigurationWithName(name: string): Promise<boolean> {
        const config = this.model.configurations.find(item => item.name === name);
        if (config) {
            return this.deleteConfiguration(config);
        }
        return Promise.resolve(false);
    }

    public load(): Promise<RhamtModel> {
        return new Promise<any>((resolve, reject) => {
            if (this.loaded) {
                return resolve(this.model);
            }
            const location = this.getModelPersistanceLocation();
            fs.exists(location, exists => {
                if (exists) {
                    fs.readFile(location, (e, data) => {
                        if (e) reject(e);
                        else this.parse(data).then(() => resolve(this.model)).catch(reject);
                    });
                }
                else {
                    this.loaded = true;
                    resolve(this.model);
                }
            });
        });
    }

    public reload(): Promise<void> {
        return new Promise<void> ((resolve, reject) => {
            const parse = async data => {
                if (data.byteLength > 0) {
                    const newConfigs = [];
                    let configs: any;
                    try {
                        configs = JSON.parse(data).configurations;
                    }
                    catch (e) {
                        return Promise.reject('Error parsing configuration data from disk');
                    }
                    for (const entry of configs) {
                        const config: RhamtConfiguration = new RhamtConfiguration();
                        ModelService.copy(entry, config);
                        if (!config.id) {
                            continue;
                        }
                        const existing = this.getConfiguration(config.id);
                        if (existing) {
                            existing.name = config.name;
                            existing.options = config.options;
                            existing.rhamtExecutable = config.rhamtExecutable;
                            existing.summary = config.summary;
                            existing.results = undefined;
                            newConfigs.push(existing);
                        }
                        else {
                            newConfigs.push(config);
                        }
                    }
                    this.model.configurations.forEach(config => {
                        const output = config.options['output'];
                        if (output) {
                            const found = newConfigs.find(item => {
                                const out = item.options['output'];
                                return out && out === output;
                            });
                            if (!found) {
                                this.deleteOuputLocation(output);
                            }
                        }
                    });
                    for (const config of newConfigs) {
                        try {
                            await ModelService.loadResults(config);
                        }
                        catch (e) {
                            return reject(e);
                        }
                    }
                    this.model.configurations = newConfigs;
                }
                else {
                    this.model.configurations = [];
                }
            };
            const location = this.getModelPersistanceLocation();
            fs.exists(location, exists => {
                if (exists) {
                    fs.readFile(location, async (e, data) => {
                        if (e) reject(e);
                        else {
                            try {
                                await parse(data);
                                resolve();
                            }
                            catch (e) {
                                reject();
                            }
                        }
                    });
                }
            });
        });
    }

    registerRuleset(location: string): void {
        if (!this.rulesets.includes(location)) {
            this.rulesets.push(location);
        }
    }

    getRulesets(): string[] {
        let allRulesets = this.rulesets.slice();
        for (const config of this.model.configurations) {
            const rulesets = config.options['userRulesDirectory'];
            if (rulesets && rulesets.length > 0) {
                rulesets.forEach(ruleset => {
                    if (!allRulesets.includes(ruleset)) {
                        allRulesets.push(ruleset);
                    }
                })
            }
        }
        return allRulesets;
    }

    getRecentCli(): string {
        let cli = '';
        const configs = this.model.configurations;
        for (var i = configs.length - 1; i >= 0; i--) {
            const cli = configs[i].options['cli'];
            if (cli) {
                return cli;
            }
        }
        return cli;
    }

    private parse(data: any): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            if (data.byteLength > 0) {
                let configs: any;
                try {
                    configs = JSON.parse(data).configurations;
                } 
                catch (e) {
                    return reject(`Error parsing configurations: ${e}`);
                }
                for (const entry of configs) {
                    const config: RhamtConfiguration = new RhamtConfiguration();
                    ModelService.copy(entry, config);
                    try {
                        if (config.summary) {
                            await ModelService.loadResults(config);
                        }
                    }
                    catch (e) {
                        return reject(e);
                    }
                    this.model.configurations.push(config);
                }
            }
            this.loaded = true;
            resolve();
        });
    }

    static async loadResults(target: RhamtConfiguration): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            try {
                await AnalyzerUtil.loadAnalyzerResults(target, false);
            }
            catch (e) {
            }
            resolve();
        });
    }

    static copy(source: any, target: RhamtConfiguration): void {
        target.id = source.id;
        target.name = source.name;
        Object.keys(source.options).forEach(key => {
            target.options[key] = source.options[key];
        });
        if (source.summary) {
            target.summary = source.summary;
        }
    }

    public async save(): Promise<void>  {
        
        const configurations = [];
        for (const config of this.model.configurations) {
            const data: any = {
                id: config.id,
                name: config.name,
                options: config.options
            };
            if (config.summary) {
                data.summary = config.summary;
            }
            configurations.push(data);
            if (config.summary && config.results) {
                try {
                    data.summary.quickfixes = this.computeQuickfixData(config);
                    data.summary.hintCount = config.summary.hintCount;
                    data.summary.classificationCount = config.summary.classificationCount;
                    data.summary.quickfixCount = config.summary.quickfixes.length;
                }
                catch (e) {
                    console.log(`Error while saving configuration results: ${e}`);
                    return Promise.reject(`Error saving configuration results: ${e}`);
                }
            }
        }
        try {
            await this.doSave(this.getModelPersistanceLocation(), {configurations});
        }
        catch (e) {
            console.log(`Error while saving configuration data: ${e}`);
            return Promise.reject(`Error saving configuration data: ${e}`);
        }
    }

    saveAnalysisResults(config: RhamtConfiguration): Promise<void> {
        return Promise.resolve();
    }

    computeQuickfixData(config: RhamtConfiguration): any {
        const result: { [index: string]: any } = {};
        let elements = [];
        elements = elements.concat(config.results.model.hints);
        elements = elements.concat(config.results.model.classifications);
        elements.forEach(element => {
            if (element.quickfixes.length > 0) {
                result[element.id] = {
                    originalLineSource: element.originalLineSource,
                    quickfixedLines: element.quickfixedLines
                }
            }
        });
        return result
    }

    public doSave(out: string, data: any): Promise<void> {
        return new Promise<void> ((resolve, reject) => {
            const dir = path.dirname(out);
            mkdirp(dir, (e: any) => {
                if (e) return reject(`Error creating configuration output file: ${e}`);
                else {
                    try {
                        const str = JSON.stringify(data, null, 4);
                        fs.writeFile(out, str, null, e => {
                            if (e) return reject(`Error saving configuration data: ${e}`);
                            else {
                                resolve();
                            }
                        });
                    }
                    catch (e) {
                        console.log(`Error using JSON.stringify for analysis results: ${e}`);
                        return reject(`Error using JSON.stringify for analysis results: ${e}`);
                    }
                }
            });
        });
    }

    public generateConfigurationName(): string {
        let newName = 'configuration';
        if (this.model.exists(newName)) {
            for (let i = 0; i < 1000; i++) {
                if (!this.model.exists(`${newName}-${i}`)) {
                    newName = `${newName}-${i}`;
                    break;
                }
            }
        }
        return newName;
    }

    static generateUniqueId(): string {
        return `${Math.random().toString(36).substr(2, 9)}-${Math.random().toString(36).substr(2, 9)}`;
    }

    public getModelPersistanceLocation(): string {
        return path.join(this.outDir, 'model.json');
    }

    async readCliMeta(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            if (this.elementData) resolve(this.elementData);
            else {
                fs.readFile(path.join(this.endpoints.resourcesRoot(), 'help.json'), (err, data: any) => {
                    if (err) reject(err);
                    else {
                        this.elementData = JSON.parse(data);
                        resolve(this.elementData);
                    }
                });
            }
        }).catch(err => {
            console.log(`ModelService :: Error reading help.json :: ${err}`);
        });
    }
    public getActiveHints(): IHint[] {
        if (this.model.configurations.length == 0) return [];
        let configs = this.model.configurations.filter(config => config.summary != undefined);
        if (configs.length === 0) {
            const config = this.model.configurations.find(config => config.results != null);
            return config == undefined ? [] : config.results.model.hints;
        }
        let hints: IHint[] = [];
        configs.filter(config => config.summary.active && config.results).forEach(config => {
            hints = hints.concat(config.results.model.hints);
        });
        return hints;
    }

    public findHint(configId: string, hintId: string): IHint | undefined {
        const config = this.model.configurations.find(config => config.id === configId);
        if (!config || !config.results) return undefined;
        return config.results.model.hints.find(hint => hint.id === hintId);
    }
}
