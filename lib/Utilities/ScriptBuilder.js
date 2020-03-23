"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const os = __importStar(require("os"));
const core = __importStar(require("@actions/core"));
const Constants_1 = __importDefault(require("../Constants"));
class ScriptBuilder {
    constructor() {
        this.script = "";
    }
    getLatestModuleScript(moduleName) {
        const command = `Get-Module -Name ${moduleName} -ListAvailable | Sort-Object Version -Descending | Select-Object -First 1`;
        this.script += `try {
            $ErrorActionPreference = "Stop"
            $WarningPreference = "SilentlyContinue"
            $output = @{}
            $data = ${command}
            $output['${Constants_1.default.AzVersion}'] = $data.Version.ToString()
            $output['${Constants_1.default.Success}'] = "true"
        }
        catch {
            $output['${Constants_1.default.Error}'] = $_.exception.Message
        }
        return ConvertTo-Json $output`;
        core.debug(`GetLatestModuleScript: ${this.script}`);
        return this.script;
    }
    checkModuleVersionScript(moduleName, version) {
        const command = `Get-Module -Name ${moduleName} -ListAvailable | Where-Object Version -match ${version}`;
        this.script += `try {
            $ErrorActionPreference = "Stop"
            $WarningPreference = "SilentlyContinue"
            $output = @{}
            $data = ${command}
            $output['${Constants_1.default.doesVersionExist}'] = [string]::IsNullOrEmpty($data)
            $output['${Constants_1.default.Success}'] = "true"
        }
        catch {
            $output['${Constants_1.default.Error}'] = $_.exception.Message
        }
        return ConvertTo-Json $output`;
        core.debug(`CheckModuleVersionScript: ${this.script}`);
        return this.script;
    }
    getInlineScriptFile(inlineScript, errorActionPreference) {
        this.script = `$ErrorActionPreference = '${errorActionPreference}'${os.EOL}${inlineScript}`;
        core.debug(`InlineScript file to be executed: ${this.script}`);
        return this.script;
    }
}
exports.default = ScriptBuilder;
