import { RhamtModel, RhamtConfiguration } from './model';

export class ModelService {

    constructor(public model: RhamtModel) {
    }

    public addConfiguration(config: RhamtConfiguration): void {
        this.model.configurations.set(config.options.get('name'), config);
    }

    public getConfiguration(id: string): RhamtConfiguration | undefined {
        return this.model.configurations.get(id);
    }

    public createConfigurationWithName(name: string): RhamtConfiguration {
        const config: RhamtConfiguration = new RhamtConfiguration();
        config.options.set('name', name);
        this.addConfiguration(config);
        return config;
    }

    public deleteConfiguration(configuration: RhamtConfiguration): boolean {
        return this.model.configurations.delete(configuration.options.get('name'));
    }

    public deleteConfigurationWithName(id: string): void {
        this.model.configurations.delete(id);
    }
}
