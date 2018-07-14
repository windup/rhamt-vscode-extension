import * as assert from 'assert';
import { RhamtService } from '../rhamtService';

suite("RHAMT Tests", function () {

    test("Start/Stop RHAMT Server", function() {
        let rhamtService = new RhamtService();
        rhamtService.startServer();
        assert.equal(rhamtService.isRunning(), false);
        rhamtService.stopServer();
        assert.equal(rhamtService.isRunning(), false);
    });
});
