"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
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
            $output['${Constants_1.default.versionExists}'] = [string]::IsNullOrEmpty($data)
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
