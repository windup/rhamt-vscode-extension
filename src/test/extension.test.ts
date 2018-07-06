import * as assert from 'assert';
import { Server } from '../server';

suite("RHAMT Tests", function () {

    test("Start/Stop RHAMT Server", function() {
        Server.start();
        assert.equal(Server.isRunning(), false);
        Server.stop();
        assert.equal(Server.isRunning(), false);
    });
    
});
