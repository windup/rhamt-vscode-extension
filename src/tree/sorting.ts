/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0
THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.
See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */

// let intlFileNameCollator: IdleValue<{ collator: Intl.Collator, collatorIsNumeric: boolean }>;

export interface IDisposable {
    dispose(): void;
}

type DOMHighResTimeStamp = number;

export interface IdleDeadline {
    readonly didTimeout: boolean;
    timeRemaining(): DOMHighResTimeStamp;
}

/**
 * Execute the callback the next time the browser is idle
 */
export let runWhenIdle: (callback: (idle: IdleDeadline) => void, timeout?: number) => IDisposable;

export class IdleValue<T> {

    private readonly _executor: () => void;
    private readonly _handle: IDisposable;

    private _didRun: boolean = false;
    private _value?: T;
    private _error: any;

    constructor(executor: () => T) {
        this._executor = () => {
            try {
                this._value = executor();
            } catch (err) {
                this._error = err;
            } finally {
                this._didRun = true;
            }
        };
        this._handle = runWhenIdle(() => this._executor());
    }

    dispose(): void {
        this._handle.dispose();
    }

    getValue(): T {
        if (!this._didRun) {
            this._handle.dispose();
            this._executor();
        }
        if (this._error) {
            throw this._error;
        }
        return this._value!;
    }
}