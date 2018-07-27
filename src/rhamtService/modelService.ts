'use strict';

import { RhamtModel, RhamtConfiguration } from "./model";

export class RhamtModelService {

    constructor(public model: RhamtModel) {
    }

    public createConfiguration(name?: string): RhamtConfiguration {
        name = name ? name : this.generateConfigurationName();
        let config: RhamtConfiguration = new RhamtConfiguration();
        config.name = name;
        this.model.configurations.set(name, config);
        return config;
    }

    public deleteConfiguration(name?: string, configuration?: RhamtConfiguration): boolean {
        name = name ? name : configuration ? configuration.name : undefined;
        if (name) {
            return this.model.configurations.delete(name);
        }
        return false;
    }

    private generateConfigurationName(): string {
        let newName = 'rhamtConfiguration';
        if (this.model.configurations.has(newName)) {
            for (var i = 0; i < 1000; i++) {
                if (!this.model.configurations.has(newName + '-' + i)) {
                    newName = newName+'-'+i;
                    break;
                }
            }
        }
		return newName;
    }
}