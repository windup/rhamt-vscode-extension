import { RhamtModel, RhamtConfiguration } from './model';

export class ModelService {

    constructor(public model: RhamtModel) {
    }

    public getConfiguration(id: string): RhamtConfiguration | undefined {
        return this.model.configurations.get(id);
    }

    public createConfigurationWithName(name: string): RhamtConfiguration {
        const config: RhamtConfiguration = new RhamtConfiguration();
        this.model.configurations.set(name, config);
        return config;
    }

    public deleteConfiguration(configuration: RhamtConfiguration): boolean {
        return this.model.configurations.delete(configuration.options.get('name'));
    }
}