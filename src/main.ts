import * as core from '@actions/core';
import * as crypto from 'crypto';
import Utils from './Utilities/Utils';
import ScriptRunner from './ScriptRunner';
import InitializeAzure from './InitializeAzure';
import { AzModuleInstaller } from './AzModuleInstaller';

const errorActionPrefValues = new Set(['STOP', 'CONTINUE', 'SILENTLYCONTINUE']);
let azPSVersion: string;

let userAgentPrefix = !!process.env.AZURE_HTTP_USER_AGENT ? `${process.env.AZURE_HTTP_USER_AGENT}` : "";

async function main() {
    try {
        // Set user agent variable
        let usrAgentRepo = crypto.createHash('sha256').update(`${process.env.GITHUB_REPOSITORY}`).digest('hex');
        let actionName = 'AzurePowerShellAction';
        let userAgentString = (!!userAgentPrefix ? `${userAgentPrefix}+` : '') + `GITHUBACTIONS_${actionName}_${usrAgentRepo}`;
        core.exportVariable('AZURE_HTTP_USER_AGENT', userAgentString);

        const inlineScript: string = core.getInput('inlineScript', { required: false });
        const inputFile: string = core.getInput('inputFile', { required: false });
        core.debug(`inlineScript: ${inlineScript}`);
        core.debug(`inputFile: ${inputFile}`);
        azPSVersion = core.getInput('azPSVersion', { required: true }).trim().toLowerCase();
        const errorActionPreference: string = core.getInput('errorActionPreference');
        const failOnStandardError = core.getInput('failOnStandardError').trim().toLowerCase() === "true";
        const githubToken = core.getInput('githubToken');
        console.log(`Validating inputs`);
        validateInputs(inlineScript, inputFile, errorActionPreference);

        const githubAuth = !githubToken || Utils.isGhes() ? undefined : `token ${githubToken}`;
        const installResult = await new AzModuleInstaller(azPSVersion, githubAuth).install();
        console.log(`Module Az ${azPSVersion} installed from ${installResult.moduleSource}`);

        console.log(`Initializing Az Module`);
        await InitializeAzure.importAzModule(azPSVersion);
        console.log(`Initializing Az Module Complete`);

        console.log(`Running Az PowerShell Script`);
        const scriptRunner: ScriptRunner = new ScriptRunner(inlineScript, inputFile, errorActionPreference, failOnStandardError);
        await scriptRunner.executeFile();
        console.log(`Script execution Complete`);
    } catch(error) {
        core.setFailed(error);
    } finally {
        // Reset AZURE_HTTP_USER_AGENT
        core.exportVariable('AZURE_HTTP_USER_AGENT', userAgentPrefix);
    }
}

function validateInputs(inlineScript: string, inputFile: string, errorActionPreference: string) {
    const inlineScriptIsNull = !inlineScript || !inlineScript.trim();
    const inputFileIsNull = !inputFile || !inputFile.trim();
    if(inlineScriptIsNull && inputFileIsNull){
        throw new Error(`inlineScript and inputFile are both empty. Please enter a valid script or a valid input file.`);
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