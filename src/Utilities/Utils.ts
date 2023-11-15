import * as os from 'os';

import Constants from '../Constants';
import PowerShellToolRunner from '../Utilities/PowerShellToolRunner';
import ScriptBuilder from './ScriptBuilder';
import path from 'path';
import fs from 'fs';

export default class Utils {
    /**
     * Add the folder path where Az modules are present to PSModulePath based on runner
     * @param azPSVersion
     * If azPSVersion is empty, folder path in which all Az modules are present are set
     * If azPSVersion is not empty, folder path of exact Az module version is set
     */
    static async setPSModulePath(azPSVersion: string = "") {
        let output: string = "";
        const options: any = {
            listeners: {
                stdout: (data: Buffer) => {
                    output += data.toString();
                }
            }
        };
        await PowerShellToolRunner.executePowerShellScriptBlock("$env:PSModulePath", options);
        const defaultPSModulePath = output.trim();

        const runner: string = process.env.RUNNER_OS || os.type();
        let defaultAzInstallFolder:string = Utils.getDefaultAzInstallFolder(runner.toLowerCase());
        let modulePath: string = path.join(defaultAzInstallFolder, `${azPSVersion}`);
        process.env.PSModulePath = `${modulePath}${path.delimiter}${defaultPSModulePath}`;
    }

    static getDefaultAzInstallFolder(os:string): string{
        let defaultAzInstallFolder = "";
        switch (os) {
            case "linux":
                defaultAzInstallFolder = "/usr/share";
                break;
            case "windows":
            case "windows_nt":
                defaultAzInstallFolder = "C:\\Modules";
                break;
            case "macos":
            case "darwin":
            default:
                defaultAzInstallFolder = "";
                break;
        }

        if(Utils.isFolderExistAndWritable(defaultAzInstallFolder)){
            return defaultAzInstallFolder;
        }
        if(Utils.isFolderExistAndWritable(process.env.RUNNER_TOOL_CACHE)){
            return process.env.RUNNER_TOOL_CACHE;
        }
        return process.cwd();
    }

    static isFolderExistAndWritable(folderPath:string) : boolean{
        if(!folderPath){
            return false;
        }
        if (!fs.existsSync(folderPath)) {
            return false;
        }
        if (!fs.lstatSync(folderPath).isDirectory() ) {
            return false;
        }
        try {
            fs.accessSync(folderPath, fs.constants.W_OK)
        } catch (err) {
            return false;
        }
        return true;
    }

    static async getLatestModule(moduleName: string): Promise<string> {
        let output: string = "";
        const options: any = {
            listeners: {
                stdout: (data: Buffer) => {
                    output += data.toString();
                }
            }
        };
        await PowerShellToolRunner.executePowerShellScriptBlock(new ScriptBuilder()
                                .getLatestModuleScript(moduleName), options);
        const outputJson = JSON.parse(output.trim());
        if (!(Constants.Success in outputJson)) {
            throw new Error(outputJson[Constants.Error]);
        }
        const azLatestVersion: string = outputJson[Constants.AzVersion];
        if (!Utils.isValidVersion(azLatestVersion)) {
            throw new Error(`Invalid AzPSVersion: ${azLatestVersion}`);
        }
        return azLatestVersion;
    }

    static async checkModuleVersion(moduleName: string, version: string) {
        let output: string = "";
        const options: any = {
            listeners: {
                stdout: (data: Buffer) => {
                    output += data.toString();
                }
            }
        };
        if (!Utils.isValidVersion(output.trim())) {
            return "";
        }
        await PowerShellToolRunner.executePowerShellCommand(new ScriptBuilder()
                                    .checkModuleVersionScript(moduleName, version), options);
        const outputJson = JSON.parse(output.trim());
        if (!(Constants.Success in outputJson)) {
            throw new Error(outputJson[Constants.Error]);
        }
        const versionExists: boolean = outputJson[Constants.versionExists].toLowerCase() === "true";
        if(!(versionExists)) {
            throw new Error("Invalid azPSVersion. Refer https://aka.ms/azure-powershell-release-notes for supported versions.");
        }
    }

    static isValidVersion(version: string): boolean {
        return !!version.match(Constants.versionPattern);
    }

    static async isHostedAgent(moduleContainerPath: string): Promise<boolean> {
        const script = `Test-Path (Join-Path "${moduleContainerPath}" "az_*")`;
        let output: string = "";
        const options: any = {
            listeners: {
                stdout: (data: Buffer) => {
                    output += data.toString();
                }
            }
        };
        await PowerShellToolRunner.executePowerShellCommand(script, options);
        return output.trim().toLowerCase() === "true";
    }
    
    static isGhes(): boolean {
        const ghUrl = new URL(
            process.env['GITHUB_SERVER_URL'] || 'https://github.com'
        );
        return ghUrl.hostname.toUpperCase() !== 'GITHUB.COM';
    }

    static async saveAzModule(version: string, modulePath: string): Promise<void> {
        const script = `
            $prevProgressPref = $ProgressPreference
            $ProgressPreference = 'SilentlyContinue'
            Save-Module -Path ${modulePath} -Name Az -RequiredVersion ${version} -Force -ErrorAction Stop
            $ProgressPreference = $prevProgressPref`;
        const exitCode = await PowerShellToolRunner.executePowerShellScriptBlock(script);
        if (exitCode != 0) {
            throw new Error(`Download from PSGallery failed for Az ${version} to ${modulePath}`);
        }
    }
}
