import * as core from '@actions/core';
import path  from 'path';

import Utils from './Utilities/Utils';
import FileUtils from './Utilities/FileUtils';
import ScriptRunner from './ScriptRunner';
import InitializeAzure from './InitializeAzure';

async function main() {
    try {
        const inlineScript: string = core.getInput('inlineScript', { required: true });
        const azPSVersion: string = core.getInput('azPSVersion', { required: true }).trim().toLowerCase();
        const errorActionPreference: string = core.getInput('errorActionPreference') || "SilentlyContinue";
        const failOnStandardError = core.getInput('failOnStandardError').trim().toLowerCase() === "true";
        if (!validateInputs(inlineScript, azPSVersion, errorActionPreference)) {
            return;
        }
        console.log(`Initializing Az Module`);
        await InitializeAzure.importAzModule(azPSVersion);
        console.log(`Initializing Az Module Complete`);
        console.log(`Running Az PowerShell Script`);
        const scriptRunner: ScriptRunner = new ScriptRunner(inlineScript, errorActionPreference, failOnStandardError);
        await scriptRunner.executeFile();
        console.log(`Script execution Complete`);
    } catch(error) {
        core.setFailed(error);
        core.error(error);
    } finally {
        const filePath: string = path.join(FileUtils.tempDirectory, FileUtils.getFileName());
        FileUtils.deleteFile(filePath);
    }
}

function validateInputs(inlineScript: string, azPSVersion: string, errorActionPreference: string): boolean {
    if (!inlineScript.trim()) {
        core.setFailed(`Invalid inlineScript : ${inlineScript}. Please enter a valid script.`);
        return false;
    }
    if (azPSVersion !== "latest") {
        if (!Utils.isValidVersion(azPSVersion)) {
            core.setFailed(`Invalid azPSVersion : ${azPSVersion}. Please enter a valid azPSVersion.`);
            return false;
        }
    }
    validateErrorActionPref(errorActionPreference);
    return true;
}

function validateErrorActionPref(errorActionPreference: string) {
    switch (errorActionPreference.toUpperCase()) {
        case 'STOP':
        case 'CONTINUE':
        case 'SILENTLYCONTINUE':
            break;
        default:
            throw new Error(`Invalid errorActionPreference: ${errorActionPreference}`);
    }
}

main()