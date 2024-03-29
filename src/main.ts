import * as core from '@actions/core';
import * as crypto from 'crypto';
import Utils from './Utilities/Utils';
import FileUtils from './Utilities/FileUtils';
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
        core.exportVariable('AZUREPS_HOST_ENVIRONMENT', userAgentString);

        const inlineScript: string = core.getInput('inlineScript', { required: true });
        azPSVersion = core.getInput('azPSVersion', { required: true }).trim().toLowerCase();
        const errorActionPreference: string = core.getInput('errorActionPreference');
        const failOnStandardError = core.getInput('failOnStandardError').trim().toLowerCase() === "true";
        const githubToken = core.getInput('githubToken');
        core.info(`Validating inputs`);
        validateInputs(inlineScript, errorActionPreference);

        const githubAuth = !githubToken || Utils.isGhes() ? undefined : `token ${githubToken}`;
        const installResult = await new AzModuleInstaller(azPSVersion, githubAuth).install();
        core.info(`Module Az ${azPSVersion} installed from ${installResult.moduleSource}`);

        core.info(`Initializing Az Module`);
        await InitializeAzure.importAzModule(azPSVersion);
        core.info(`Initializing Az Module Complete`);

        core.info(`Running Az PowerShell Script`);
        const scriptRunner: ScriptRunner = new ScriptRunner(inlineScript, errorActionPreference, failOnStandardError);
        await scriptRunner.executeFile();
        core.info(`Script execution Complete`);
    } catch(error) {
        core.setFailed(error);
    } finally {
        FileUtils.deleteFile(ScriptRunner.filePath);
        // Reset AZURE_HTTP_USER_AGENT
        core.exportVariable('AZURE_HTTP_USER_AGENT', userAgentPrefix);
        core.exportVariable('AZUREPS_HOST_ENVIRONMENT', userAgentPrefix);
    }
}

function validateInputs(inlineScript: string, errorActionPreference: string) {
    if (!inlineScript.trim()) {
        throw new Error(`inlineScript is empty. Please enter a valid script.`);
    }
    if (azPSVersion !== "latest") {
        if (!Utils.isValidVersion(azPSVersion)) {
            core.info(`Invalid azPSVersion : ${azPSVersion}. Using latest Az Module version.`);
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