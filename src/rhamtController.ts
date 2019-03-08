import { RhamtConfiguration } from './model/model';
import { RhamtRunner } from './rhamtRunner';

export class RhamtController {

    private config: RhamtConfiguration;
    private rhamtRunner: RhamtRunner;

    constructor(config: RhamtConfiguration) {
        this.config = config;
        this.rhamtRunner = new RhamtRunner(this.config);
    }

    public startServer() {
    }

    public analyze() {
        this.rhamtRunner.analyze();
    }
}
