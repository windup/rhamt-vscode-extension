import { RhamtModel, RhamtConfiguration } from './model';
import * as fs from 'fs';

export class ModelService {

    constructor(public model: RhamtModel) {
    }

    public addConfiguration(config: RhamtConfiguration): void {
        this.model.configurations.set(config.id, config);
    }

    public getConfiguration(id: string): RhamtConfiguration | undefined {
        return this.model.configurations.get(id);
    }

    public getConfigurationWithName(name: string): RhamtConfiguration | undefined {
        return this.model.getConfigurations().find(item => item.name === name);
    }

    public createConfigurationWithName(name: string): RhamtConfiguration {
        const config: RhamtConfiguration = new RhamtConfiguration();
        config.id = ModelService.generateUniqueId();
        config.name = name;
        this.addConfiguration(config);
        return config;
    }

    public deleteConfiguration(configuration: RhamtConfiguration): boolean {
        return this.model.configurations.delete(configuration.id);
    }

    public deleteConfigurationWithName(name: string): boolean {
        const config = this.model.getConfigurations().find(item => item.name === name);
        if (config) {
            return this.deleteConfiguration(config);
        }
        return false;
    }

    public load(location: string): Promise<RhamtModel> {
        return new Promise<any>((resolve, reject) => {
            fs.exists(location, exists => {
                if (exists) {
                    fs.readFile(location, (e, data) => {
                        if (e) reject(e);
                        else this.parse(data).then(() => resolve(this.model)).catch(reject);
                    });
                }
                else resolve();
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
                    this.model.configurations.set(config.id, config);
                }
            }
            resolve();
        });
    }

    static copy(source: any, target: RhamtConfiguration): void {
        target.id = source.id;
        target.name = source.name;
        Object.keys(source.options).forEach(function(key) {
            target.options[key] = source.options[key];
        });
    }

    public save(outDir: string): void {
        const data = {configurations: this.model.getConfigurations()};
        this.doSave(outDir, data);
    }

    public doSave(out: string, data: any): Promise<void> {
        return new Promise<void> ((resolve, reject) => {
            fs.writeFile(out, JSON.stringify(data, null, 4), null, e => {
                if (e) reject(e);
                else resolve();
            });
        });
    }

    static generateUniqueId(): string {
        return `-${Math.random().toString(36).substr(2, 9)}-${Math.random().toString(36).substr(2, 9)}`;
    }
}
