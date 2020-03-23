import * as os from 'os';
import * as core from '@actions/core';

import Constants from "../Constants";

export default class ScriptBuilder {
    script: string = "";

    getLatestModuleScript(moduleName: string): string {
        const command: string = `Get-Module -Name ${moduleName} -ListAvailable | Sort-Object Version -Descending | Select-Object -First 1`;
        this.script += `try {
            $ErrorActionPreference = "Stop"
            $WarningPreference = "SilentlyContinue"
            $output = @{}
            $data = ${command}
            $output['${Constants.AzVersion}'] = $data.Version.ToString()
            $output['${Constants.Success}'] = "true"
        }
        catch {
            $output['${Constants.Error}'] = $_.exception.Message
        }
        return ConvertTo-Json $output`;
        core.debug(`GetLatestModuleScript: ${this.script}`);
        return this.script;
    }

    checkModuleVersionScript(moduleName: string, version: string) {
        const command: string = `Get-Module -Name ${moduleName} -ListAvailable | Where-Object Version -match ${version}`;
        this.script += `try {
            $ErrorActionPreference = "Stop"
            $WarningPreference = "SilentlyContinue"
            $output = @{}
            $data = ${command}
            $output['${Constants.doesVersionExist}'] = [string]::IsNullOrEmpty($data)
            $output['${Constants.Success}'] = "true"
        }
        catch {
            $output['${Constants.Error}'] = $_.exception.Message
        }
        return ConvertTo-Json $output`;
        core.debug(`CheckModuleVersionScript: ${this.script}`);
        return this.script;
    }

    getInlineScriptFile(inlineScript: string, errorActionPreference: string) {
        this.script = `$ErrorActionPreference = '${errorActionPreference}'${os.EOL}${inlineScript}`
        core.debug(`InlineScript file to be executed: ${this.script}`);
        return this.script;
    }
}
