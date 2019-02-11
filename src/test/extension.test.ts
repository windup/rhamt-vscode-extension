import * as assert from 'assert';
import { RhamtService } from '../rhamtService';
import { RhamtModel, RhamtModelService } from 'raas-core';
import * as path from 'path';

suite("RHAMT Tests", function () {

    test("Start/Stop RHAMT Server", function() {
        const modelService = new RhamtModelService(new RhamtModel(), path.join(__dirname, '..', 'data'));
        let rhamtService = new RhamtService();
        const config = modelService.createConfiguration();
        rhamtService.startServer(config);
        assert.equal(rhamtService.isRunning(), false);
        rhamtService.stopServer();
        assert.equal(rhamtService.isRunning(), false);
    });
});
