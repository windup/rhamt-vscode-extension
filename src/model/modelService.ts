/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { RhamtModel, RhamtConfiguration, Endpoints } from './model';
import * as fs from 'fs';
import { rhamtEvents } from '../events';
import * as path from 'path';
import * as fse from 'fs-extra';
import * as mkdirp from 'mkdirp';
import { AnalysisResults, AnalysisResultsUtil } from './analysisResults';

export class ModelService {

    public loaded: boolean = false;
    public onLoaded = new rhamtEvents.TypedEvent<RhamtModel>();

    constructor(
        public model: RhamtModel,
        public outDir: string,
        public reportEndpoints: Endpoints) {
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
                    this.onLoaded.emit(this.model);
                    resolve();
                }
            });
        });
    }

    public reload(): Promise<any> {
        return new Promise<any> ((resolve, reject) => {
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

    private parse(data: any): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
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
                        await ModelService.loadResults(config);
                    }
                    catch (e) {
                        return reject(e);
                    }
                    this.model.configurations.push(config);
                }
            }
            this.loaded = true;
            this.onLoaded.emit(this.model);
            resolve();
        });
    }

    static async loadResults(target: RhamtConfiguration): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const location = target.getResultsLocation();
            fs.exists(location, async exists => {
                if (exists) {
                    try {
                        const dom = await AnalysisResultsUtil.loadFromLocation(location);
                        target.results = new AnalysisResults(target, dom);
                    } catch (e) {
                        return reject(`Error loading analysis results for configuration at ${location} - ${e}`);
                    }
                }
                resolve();
            });
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
            if (config.results) {
                try {
                    await config.results.save(config.getResultsLocation());
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

    public doSave(out: string, data: any): Promise<void> {
        return new Promise<void> ((resolve, reject) => {
            const dir = path.dirname(out);
            console.log(`Attempting to save configuration data at: out - ${out}`);
            mkdirp(dir, (e: any) => {
                if (e) reject(`Error creating configuration output file: ${e}`);
                else {
                    console.log(`Configuration data:`);
                    console.log(data);
                    try {
                        const str = JSON.stringify(data, null, 4);
                        console.log(`Serialized data is: ${str}`);
                        fs.writeFile(out, str, null, e => {
                            if (e) reject(`Error saving configuration data: ${e}`);
                            else {
                                console.log(`Successfully saved configuration data.`);
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

    private generateConfigurationName(): string {
        let newName = 'rhamtConfiguration';
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
        return `-${Math.random().toString(36).substr(2, 9)}-${Math.random().toString(36).substr(2, 9)}`;
    }

    public onModelLoaded(listen: (m: RhamtModel) => void): rhamtEvents.Disposable {
        if (this.loaded) {
            listen(this.model);
        }
        return this.onLoaded.on(listen);
    }

    public getModelPersistanceLocation(): string {
        return path.join(this.outDir, 'model.json');
    }
}
