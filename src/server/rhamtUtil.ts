/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';
import { Utils } from '../Utils';
import { RhamtConfiguration } from '../model/model';
import { RhamtRunner } from './rhamtRunner';
import { RhamtProcessController } from './rhamtProcessController';
import { ProgressMonitor } from './progressMonitor';
import * as path from 'path';
import { AnalysisResultsUtil, AnalysisResults } from '../model/analysisResults';
import { ModelService } from '../model/modelService';
import { rhamtChannel } from '../util/console';
import * as fs from 'fs-extra';
const PROGRESS = ':progress:';
const START_TIMEOUT = 60000;
const START_PROGRESS = 'Using user rules dir:';

export class RhamtUtil {

    static async analyze(config: RhamtConfiguration, modelService: ModelService, onStarted: () => void, onAnalysisComplete: () => void): Promise<RhamtProcessController> {
        try {
            await Utils.initConfiguration(config, modelService);
        } catch (e) {
            return Promise.reject(e);
        }

        return vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            cancellable: true
        }, async (progress: any, token: any) => {
            return new Promise<any>(async resolve => {
                const executable = config.rhamtExecutable;
                console.log(`Using configuration executable - ${executable}`);
                const windupHome = path.resolve(executable, '..', '..');
                console.log(`Using windup home - ${windupHome}`);
                let params = [];
                try {
                    params = await RhamtUtil.buildParams(config, windupHome);
                }
                catch (e) {
                    vscode.window.showErrorMessage(`Error: ${e}`);
                    return Promise.reject(e);
                }
                rhamtChannel.clear();
                const skipReport = config.options['skipReports'];
                progress.report({message: 'Executing mta-cli script...'});
                let cancelled = false;
                let resolved = false;
                let processController: RhamtProcessController;
                const date = new Date();
                const time = date.toLocaleTimeString();
                const timestamp = time.substring(0, time.lastIndexOf(':'));
                const sun = time.substring(time.lastIndexOf(' ') + 1);
                const year = new String(date.getFullYear()).substring(0, 2);
                const executedTimestamp = `${date.getMonth()}/${date.getDate()}/${year} @ ${timestamp}${sun}`;
                const onComplete = async () => {
                    processController.shutdown();
                    console.log(`config output: ${config.options['output']}`);
                    console.log(`config generated location: ${config.options['generateOutputLocation']}`);
                    if (config.options['ouput'] != config.options['generateOutputLocation']) {
                        console.log('moving results...');
                        progress.report({message: 'Gathering results...'});
                        try {
                            console.log(config.options['output']);
                            console.log(config.options['generateOutputLocation']);
                            console.log(typeof config.options['output']);
                            console.log(typeof config.options['generateOutputLocation']);
                            fs.moveSync(config.options['generateOutputLocation'], config.options['ouput']);  
                            // fs. rmdirSync(config.options['generateOutputLocation']);                  
                        }
                        catch (e) {
                            console.log(`Error moving results: ${e}`);
                            vscode.window.showErrorMessage(e);
                        }
                    }
                    if (!skipReport) {
                        vscode.window.showInformationMessage('Analysis complete', 'Open Report').then(result => {
                            if (result === 'Open Report') {
                                vscode.commands.executeCommand('rhamt.openReportExternal', {
                                    getReport: () => {
                                        return config.getReport();
                                    }
                                });
                            }
                        });
                    }
                    else {
                        vscode.window.showInformationMessage('Analysis complete');
                    }
                    try {
                        await this.loadResults(config, modelService, executedTimestamp, skipReport);
                    }
                    catch (e) {
                        console.log(`Error loading analysis results: ${e}`);
                        vscode.window.showErrorMessage(e);
                    }
                    onAnalysisComplete();
                    if (!resolved) {
                        resolve();
                    }
                };
                const monitor = new ProgressMonitor(progress, onComplete);
                let startedProgress = false;
                const onMessage = (data: string) => {
                    console.log(`Output: ` + data);
                    rhamtChannel.print(data);
                    if (data.includes(PROGRESS)) {
                        const trimmed = data.trim();
                        const split = trimmed.split(PROGRESS);
                        split.forEach(element => {
                            if (element) {
                                const raw = element.replace(PROGRESS, '').trim();
                                if (raw.includes('{"op":"') && !raw.includes('"op":"logMessage"')) {
                                    try {
                                        const json = JSON.parse(raw);
                                        monitor.handleMessage(json);
                                    }
                                    catch (e) {
                                        console.log(`Error Parsing: ${e}`);
                                    }
                                }
                            }
                        });
                    }
                    else {
                        data = data.trim();
                        if (!startedProgress && data && data.length > 1) {
                            if (data.includes(START_PROGRESS)) {
                                startedProgress = true;
                            }
                            rhamtChannel.print(data);
                        }
                    }
                };
                const onShutdown = () => {
                    console.log('mta-cli shutdown');
                    if (!resolved) {
                        resolved = true;
                        resolve();
                    }
                };
                try {
                    console.log(`Executing MTA using params: ${params}`);
                    processController = await RhamtRunner.run(windupHome, config.rhamtExecutable, params, START_TIMEOUT, onMessage).then(cp => {
                        onStarted();
                        return new RhamtProcessController(config.rhamtExecutable, cp, onShutdown);
                    });
                    if (cancelled) {
                        console.log('mta-cli was cancelled during startup.');
                        processController.shutdown();
                        return;
                    }
                } catch (e) {
                    console.log(e);
                    progress.report({message: `Error: ${e}`});
                    return Promise.reject();
                }
                token.onCancellationRequested(() => {
                    cancelled = true;
                    if (processController) {
                        processController.shutdown();
                    }
                    if (!resolved) {
                        resolved = true;
                        resolve();
                    }
                });
                progress.report({ message: 'Preparing analysis configuration...' });
            });
        });
    }

    private static buildParams(config: RhamtConfiguration, windupHome: string): Promise<any[]> {
        const params = [];
        const options = config.options;
        params.push('--toolingMode');

        // input
        params.push('--input');
        const input = options['input'];
        if (!input || input.length === 0) {
            return Promise.reject('input is missing from configuration');
        }
        let inputArray = [];
        input.forEach(entry => {
            inputArray.push(`"${entry}"`);
        });
        params.push(inputArray.join(' '));

        // output
        params.push('--output');
        const output = config.options['generateOutputLocation'];
        if (!output || output === '') {
            return Promise.reject('output is missing from configuration');
        }
        params.push(`"${output}"`);

        // sourceMode
        if (config.options['sourceMode']) {
            params.push('--sourceMode');
        }

        // skipReports
        if (config.options['skipReports']) {
            params.push('--skipReports');
        }

        // ignorePattern
        // params.push('--ignorePattern');
        // params.push('\\.class$');

        // windupHome
        params.push('--windupHome');
        params.push(`"${windupHome}"`);

        // source
        const source = config.options['source'];
        if (source && source.length > 0) {
            params.push('--source');
            source.forEach((i: any) => {
                params.push(i);
            });
        }

        // target
        let target = options['target'];
        if (!target) {
            target = [];
        }
        if (target.length === 0) {
            target.push('eap7');
        }
        params.push('--target');
        target.forEach((i: any) => {
            params.push(i);
        });

        // userRulesDirectory
        let userRulesDirectory = options['userRulesDirectory'];
        if (userRulesDirectory && userRulesDirectory.length > 0) {
            params.push('--userRulesDirectory');
            const pathArray = [];
            userRulesDirectory.forEach(entry => {
                pathArray.push(`"${entry}"`);
            });
            params.push(pathArray.join(' '));
        }

        // userIgnorePath
        let userIgnorePath = options['userIgnorePath'];
        if (userIgnorePath) {
            params.push('--userIgnorePath');
            params.push(`"${userIgnorePath}"`);
        }

        // overwrite
        if (options['overwrite']) {
            params.push('--overwrite');
        }

        // excludePackages
        const excludePackages = options['excludePackages'];
        if (excludePackages && excludePackages.length > 0) {
            params.push('--excludePackages');
            params.push(excludePackages.join(' '));
        }

        // mavenizeGroupId
        const mavenizeGroupId = options['mavenizeGroupId'];
        if (mavenizeGroupId) {
            params.push('--mavenizeGroupId');
            params.push(mavenizeGroupId);
        }

        // exportCSV
        if (options['exportCSV']) {
            params.push('--exportCSV');
        }
        
        // excludeTags
        const excludeTags = options['excludeTags'];
        if (excludeTags && excludeTags.length > 0) {
            params.push('--excludeTags');
            params.push(excludeTags.join(' '));
        }

        // packages
        const packages = options['packages'];
        if (packages && packages.length > 0) {
            params.push('--packages');
            params.push(packages.join(' '));
        }

        // additionalClasspath
        let additionalClasspath = options['additionalClasspath'];
        if (additionalClasspath && additionalClasspath.length > 0) {
            params.push('--additionalClasspath');
            const pathArray = [];
            additionalClasspath.forEach(entry => {
                pathArray.push(`"${entry}"`);
            });
            params.push(pathArray.join(' '));
        }

        // disableTattletale
        if (options['disableTattletale']) {
            params.push('--disableTattletale');
        }

        // enableCompatibleFilesReport
        if (options['enableCompatibleFilesReport']) {
            params.push('--enableCompatibleFilesReport');
        }

        // includeTags
        const includeTags = options['includeTags'];
        if (includeTags && includeTags.length > 0) {
            params.push('--includeTags');
            params.push(includeTags.join(' '));
        }

        // online
        if (options['online']) {
            params.push('--online');
        }

        // enableClassNotFoundAnalysis
        if (options['enableClassNotFoundAnalysis']) {
            params.push('--enableClassNotFoundAnalysis');
        }

        // enableTattletale
        if (options['enableTattletale']) {
            params.push('--enableTattletale');
        }

        // explodedApp
        if (options['explodedApp']) {
            params.push('--explodedApp');
        }

        // keepWorkDirs
        if (options['keepWorkDirs']) {
            params.push('--keepWorkDirs');
        }

        // mavenize
        if (options['mavenize']) {
            params.push('--mavenize');
        }

        // inputApplicationName
        const inputApplicationName = options['inputApplicationName'];
        if (inputApplicationName) {
            params.push('--inputApplicationName');
            params.push(inputApplicationName);
        }

        console.log("Console: " + params);

        return Promise.resolve(params);
    }

    private static async loadResults(config: RhamtConfiguration, modelService: ModelService, startedTimestamp: string, skippedReports: any): Promise<any> {
        try {
            // TODO: We need these set up steps in IntelliJ
            // open results.xml, set IDs, save to disk
            const dom = await AnalysisResultsUtil.loadAndPersistIDs(config.getResultsLocation());
            console.log(`Skipped reports: ${skippedReports}`);
            config.summary = {
                skippedReports,
                outputLocation: config.options['output'],
                executedTimestamp: startedTimestamp,
                executable: config.rhamtExecutable
            };
            // open results.xml, load hints/classifications, read quickfix lines
            config.results = new AnalysisResults(dom, config);
            await config.results.init();
            // setup quickfix data to be saved in model.json
            config.summary.quickfixes = modelService.computeQuickfixData(config);
            config.summary.hintCount = config.results.model.hints.length;
            config.summary.classificationCount = config.results.model.classifications.length;
        }
        catch (e) {
            return Promise.reject(`Error loading analysis results from (${config.getResultsLocation()}): ${e}`);
        }
        try {
            // save model with new analysis results and quickfix info
            await modelService.save();
        }
        catch (e) {
            console.log(`Error saving analysis results: ${e}`);
            return Promise.reject(`Error saving analysis results: ${e}`);
        }
    }
}