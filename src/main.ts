import * as core from '@actions/core';
import Utils from './Utilities/Utils';
import FileUtils from './Utilities/FileUtils';
import ScriptRunner from './ScriptRunner';
import InitializeAzure from './InitializeAzure';

const errorActionPrefValues = new Set(['STOP', 'CONTINUE', 'SILENTLYCONTINUE']);
let azPSVersion: string;
async function main() {
    try {
        const inlineScript: string = core.getInput('inlineScript', { required: true });
        azPSVersion = core.getInput('azPSVersion', { required: true }).trim().toLowerCase();
        const errorActionPreference: string = core.getInput('errorActionPreference');
        const failOnStandardError = core.getInput('failOnStandardError').trim().toLowerCase() === "true";
        console.log(`Validating inputs`);
        validateInputs(inlineScript, errorActionPreference);

        console.log(`Initializing Az Module`);
        await InitializeAzure.importAzModule(azPSVersion);
        console.log(`Initializing Az Module Complete`);

        console.log(`Running Az PowerShell Script`);
        const scriptRunner: ScriptRunner = new ScriptRunner(inlineScript, errorActionPreference, failOnStandardError);
        await scriptRunner.executeFile();
        console.log(`Script execution Complete`);
    } catch(error) {
        core.setFailed(error);
    } finally {
        FileUtils.deleteFile(ScriptRunner.filePath);
    }
}

function validateInputs(inlineScript: string, errorActionPreference: string) {
    if (!inlineScript.trim()) {
        throw new Error(`inlineScript is empty. Please enter a valid script.`);
    }
    if (azPSVersion !== "latest") {
        if (!Utils.isValidVersion(azPSVersion)) {
            console.log(`Invalid azPSVersion : ${azPSVersion}. Using latest Az Module version.`);
            azPSVersion = 'latest';
        }
    }
    validateErrorActionPref(errorActionPreference);
}

function validateErrorActionPref(errorActionPreference: string) {
    if(!(errorActionPrefValues.has(errorActionPreference.toUpperCase()))) {
        throw new Error(`Invalid errorActionPreference: ${errorActionPreference}`);
    }
}

main()