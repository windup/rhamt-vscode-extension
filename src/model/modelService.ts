import { RhamtModel, RhamtConfiguration } from './model';
import * as fs from 'fs';
import { rhamtEvents } from '../events';
import * as path from 'path';
import * as fse from 'fs-extra';
import * as mkdirp from 'mkdirp';
import { AnalysisResults, AnalysisResultsUtil } from './analysisResults';

export class ModelService {

    public loaded: boolean = false;
    public onLoaded = new rhamtEvents.TypedEvent<RhamtModel>();

    constructor(public model: RhamtModel, public outDir: string) {
    }

    public addConfiguration(config: RhamtConfiguration): void {
        this.model.configurations.push(config);
        this.save();
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

    public deleteConfiguration(configuration: RhamtConfiguration): boolean {
        const index = this.model.configurations.indexOf(configuration, 0);
        if (index > -1) {
            this.model.configurations.splice(index, 1);
            const output = configuration.options['output'];
            if (output) {
                this.deleteOuputLocation(output);
            }
            this.save();
            return true;
        }
        return false;
    }

    private deleteOuputLocation(location: string) {
        fs.exists(location, exists => {
            if (exists) {
                fse.remove(location);
            }
        });
    }

    public deleteConfigurationWithName(name: string): boolean {
        const config = this.model.configurations.find(item => item.name === name);
        if (config) {
            return this.deleteConfiguration(config);
        }
        return false;
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
                    const configs = JSON.parse(data).configurations;
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
                    newConfigs.forEach(async config => await ModelService.loadResults(config));
                    this.model.configurations = newConfigs;
                }
                else {
                    this.model.configurations = [];
                }
                resolve();
            };
            const location = this.getModelPersistanceLocation();
            fs.exists(location, exists => {
                if (exists) {
                    fs.readFile(location, (e, data) => {
                        if (e) reject(e);
                        else parse(data);
                    });
                }
            });
        });
    }

    private parse(data: any): Promise<any> {
        return new Promise<any>(async resolve => {
            if (data.byteLength > 0) {
                const configs = JSON.parse(data).configurations;
                for (const entry of configs) {
                    const config: RhamtConfiguration = new RhamtConfiguration();
                    ModelService.copy(entry, config);
                    await ModelService.loadResults(config);
                    this.model.configurations.push(config);
                }
            }
            this.loaded = true;
            this.onLoaded.emit(this.model);
            resolve();
        });
    }

    static async loadResults(target: RhamtConfiguration): Promise<void> {
        return new Promise<void>(resolve => {
            const location = target.getResultsLocation();
            fs.exists(location, async exists => {
                if (exists) {
                    try {
                        const dom = await AnalysisResultsUtil.loadFromLocation(location);
                        target.results = new AnalysisResults(target, dom);
                    } catch (e) {
                        console.log(`Error loading analysis results for configuration at ${location} - ${e}`);
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

    public save(): void {
        const configurations = [];
        this.model.configurations.forEach(config => {
            const data: any = {
                id: config.id,
                name: config.name,
                options: config.options
            };
            if (config.summary) {
                data.summary = config.summary;
            }
            configurations.push(data);
        });
        this.doSave(this.getModelPersistanceLocation(), {configurations});
    }

    public doSave(out: string, data: any): Promise<void> {
        return new Promise<void> ((resolve, reject) => {
            mkdirp(require('path').dirname(out), (e: any) => {
                if (e) reject(e);
                fs.writeFile(out, JSON.stringify(data, null, 4), null, e => {
                    if (e) reject(e);
                    else resolve();
                });
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
