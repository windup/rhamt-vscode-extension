/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as testRunner from 'vscode/lib/testrunner';

testRunner.configure({
    ui: 'tdd',
    useColors: true
});

module.exports = testRunner;