"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
const core = __importStar(require("@actions/core"));
const path_1 = __importDefault(require("path"));
const Utils_1 = __importDefault(require("./Utilities/Utils"));
const FileUtils_1 = __importDefault(require("./Utilities/FileUtils"));
const ScriptRunner_1 = __importDefault(require("./ScriptRunner"));
const InitializeAzure_1 = __importDefault(require("./InitializeAzure"));
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const inlineScript = core.getInput('inlineScript', { required: true });
            const azPSVersion = core.getInput('azPSVersion', { required: true }).trim().toLowerCase();
            const errorActionPreference = core.getInput('errorActionPreference') || "SilentlyContinue";
            const failOnStandardError = core.getInput('failOnStandardError').trim().toLowerCase() === "true";
            if (!validateInputs(inlineScript, azPSVersion, errorActionPreference)) {
                return;
            }
            console.log(`Initializing Az Module`);
            yield InitializeAzure_1.default.importAzModule(azPSVersion);
            console.log(`Initializing Az Module Complete`);
            console.log(`Running Az PowerShell Script`);
            const scriptRunner = new ScriptRunner_1.default(inlineScript, errorActionPreference, failOnStandardError);
            yield scriptRunner.executeFile();
            console.log(`Script execution Complete`);
        }
        catch (error) {
            core.setFailed(error);
            core.error(error);
        }
        finally {
            const filePath = path_1.default.join(FileUtils_1.default.tempDirectory, FileUtils_1.default.getFileName());
            FileUtils_1.default.deleteFile(filePath);
        }
    });
}
function validateInputs(inlineScript, azPSVersion, errorActionPreference) {
    if (!inlineScript.trim()) {
        core.setFailed(`Invalid inlineScript : ${inlineScript}. Please enter a valid script.`);
        return false;
    }
    if (azPSVersion !== "latest") {
        if (!Utils_1.default.isValidVersion(azPSVersion)) {
            core.setFailed(`Invalid azPSVersion : ${azPSVersion}. Please enter a valid azPSVersion.`);
            return false;
        }
    }
    validateErrorActionPref(errorActionPreference);
    return true;
}
function validateErrorActionPref(errorActionPreference) {
    switch (errorActionPreference.toUpperCase()) {
        case 'STOP':
        case 'CONTINUE':
        case 'SILENTLYCONTINUE':
            break;
        default:
            throw new Error(`Invalid errorActionPreference: ${errorActionPreference}`);
    }
}
main();
