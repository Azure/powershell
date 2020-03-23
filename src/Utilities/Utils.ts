import * as os from 'os';

import Constants from '../Constants';
import PowerShellToolRunner from '../Utilities/PowerShellToolRunner';
import ScriptBuilder from './ScriptBuilder';

export default class Utils {
    static setPSModulePath(azPSVersion: string = "") {
        let modulePath: string = "";
        const runner: string = process.env.RUNNER_OS || os.type();
        switch (runner.toLowerCase()) {
            case "linux":
                modulePath = `/usr/share/${azPSVersion}:`;
                break;
            case "windows":
            case "windows_nt":
                modulePath = `C:\\Modules\\${azPSVersion};`;
                break;
            case "macos":
            case "darwin":
                throw new Error(`OS not supported`);
            default:
                throw new Error(`Unknown os: ${runner.toLowerCase()}`);
        }
        process.env.PSModulePath = `${modulePath}${process.env.PSModulePath}`;
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
        await PowerShellToolRunner.init();
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
        await PowerShellToolRunner.init();
        await PowerShellToolRunner.executePowerShellCommand(new ScriptBuilder()
                                    .checkModuleVersionScript(moduleName, version), options);
        const outputJson = JSON.parse(output.trim());
        if (!(Constants.Success in outputJson)) {
            throw new Error(outputJson[Constants.Error]);
        }
        const doesVersionExist: boolean = outputJson[Constants.doesVersionExist].toLowerCase() === "true";
        if(!(doesVersionExist)) {
            throw new Error("Invalid azPSVersion. Refer https://aka.ms/azure-powershell-release-notes for supported versions.");
        }
    }

    static isValidVersion(version: string): boolean {
        return !!version.match(Constants.versionPattern);
    }

}

