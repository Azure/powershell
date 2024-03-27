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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const os = __importStar(require("os"));
const Constants_1 = __importDefault(require("../Constants"));
const PowerShellToolRunner_1 = __importDefault(require("../Utilities/PowerShellToolRunner"));
const ScriptBuilder_1 = __importDefault(require("./ScriptBuilder"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
class Utils {
    /**
     * Add the folder path where Az modules are present to PSModulePath based on runner
     * @param azPSVersion
     * If azPSVersion is empty, folder path in which all Az modules are present are set
     * If azPSVersion is not empty, folder path of exact Az module version is set
     */
    static setPSModulePath(azPSVersion = "") {
        return __awaiter(this, void 0, void 0, function* () {
            let output = "";
            const options = {
                listeners: {
                    stdout: (data) => {
                        output += data.toString();
                    }
                }
            };
            yield PowerShellToolRunner_1.default.executePowerShellScriptBlock("$env:PSModulePath", options);
            const defaultPSModulePath = output.trim();
            const runner = process.env.RUNNER_OS || os.type();
            let defaultAzInstallFolder = Utils.getDefaultAzInstallFolder(runner.toLowerCase());
            let modulePath = path_1.default.join(defaultAzInstallFolder, `${azPSVersion}`);
            process.env.PSModulePath = `${modulePath}${path_1.default.delimiter}${defaultPSModulePath}`;
        });
    }
    static getDefaultAzInstallFolder(os) {
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
        if (Utils.isFolderExistAndWritable(defaultAzInstallFolder)) {
            return defaultAzInstallFolder;
        }
        if (Utils.isFolderExistAndWritable(process.env.RUNNER_TOOL_CACHE)) {
            return process.env.RUNNER_TOOL_CACHE;
        }
        return process.cwd();
    }
    static isFolderExistAndWritable(folderPath) {
        if (!folderPath) {
            return false;
        }
        if (!fs_1.default.existsSync(folderPath)) {
            return false;
        }
        if (!fs_1.default.lstatSync(folderPath).isDirectory()) {
            return false;
        }
        try {
            fs_1.default.accessSync(folderPath, fs_1.default.constants.W_OK);
        }
        catch (err) {
            return false;
        }
        return true;
    }
    static getLatestModule(moduleName) {
        return __awaiter(this, void 0, void 0, function* () {
            let output = "";
            const options = {
                listeners: {
                    stdout: (data) => {
                        output += data.toString();
                    }
                }
            };
            yield PowerShellToolRunner_1.default.executePowerShellScriptBlock(new ScriptBuilder_1.default()
                .getLatestModuleScript(moduleName), options);
            const outputJson = JSON.parse(output.trim());
            if (!(Constants_1.default.Success in outputJson)) {
                throw new Error(outputJson[Constants_1.default.Error]);
            }
            const azLatestVersion = outputJson[Constants_1.default.AzVersion];
            if (!Utils.isValidVersion(azLatestVersion)) {
                throw new Error(`Invalid AzPSVersion: ${azLatestVersion}`);
            }
            return azLatestVersion;
        });
    }
    static checkModuleVersion(moduleName, version) {
        return __awaiter(this, void 0, void 0, function* () {
            let output = "";
            const options = {
                listeners: {
                    stdout: (data) => {
                        output += data.toString();
                    }
                }
            };
            if (!Utils.isValidVersion(output.trim())) {
                return "";
            }
            yield PowerShellToolRunner_1.default.executePowerShellCommand(new ScriptBuilder_1.default()
                .checkModuleVersionScript(moduleName, version), options);
            const outputJson = JSON.parse(output.trim());
            if (!(Constants_1.default.Success in outputJson)) {
                throw new Error(outputJson[Constants_1.default.Error]);
            }
            const versionExists = outputJson[Constants_1.default.versionExists].toLowerCase() === "true";
            if (!(versionExists)) {
                throw new Error("Invalid azPSVersion. Refer https://aka.ms/azure-powershell-release-notes for supported versions.");
            }
        });
    }
    static isValidVersion(version) {
        return !!version.match(Constants_1.default.versionPattern);
    }
    static isHostedAgent(moduleContainerPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const script = `Test-Path (Join-Path "${moduleContainerPath}" "az_*")`;
            let output = "";
            const options = {
                listeners: {
                    stdout: (data) => {
                        output += data.toString();
                    }
                }
            };
            yield PowerShellToolRunner_1.default.executePowerShellCommand(script, options);
            return output.trim().toLowerCase() === "true";
        });
    }
    static isGhes() {
        const ghUrl = new URL(process.env['GITHUB_SERVER_URL'] || 'https://github.com');
        return ghUrl.hostname.toUpperCase() !== 'GITHUB.COM';
    }
    static saveAzModule(version, modulePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const script = `
            $prevProgressPref = $ProgressPreference
            $ProgressPreference = 'SilentlyContinue'
            Save-Module -Path ${modulePath} -Name Az -RequiredVersion ${version} -Force -ErrorAction Stop
            $ProgressPreference = $prevProgressPref`;
            const exitCode = yield PowerShellToolRunner_1.default.executePowerShellScriptBlock(script);
            if (exitCode != 0) {
                throw new Error(`Download from PSGallery failed for Az ${version} to ${modulePath}`);
            }
        });
    }
}
exports.default = Utils;
