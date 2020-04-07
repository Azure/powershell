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
const Utils_1 = __importDefault(require("./Utilities/Utils"));
const FileUtils_1 = __importDefault(require("./Utilities/FileUtils"));
const ScriptRunner_1 = __importDefault(require("./ScriptRunner"));
const InitializeAzure_1 = __importDefault(require("./InitializeAzure"));
const errorActionPrefValues = new Set(['STOP', 'CONTINUE', 'SILENTLYCONTINUE']);
let azPSVersion;
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const inlineScript = core.getInput('inlineScript', { required: true });
            azPSVersion = core.getInput('azPSVersion', { required: true }).trim().toLowerCase();
            const errorActionPreference = core.getInput('errorActionPreference');
            const failOnStandardError = core.getInput('failOnStandardError').trim().toLowerCase() === "true";
            console.log(`Validating inputs`);
            validateInputs(inlineScript, errorActionPreference);
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
        }
        finally {
            FileUtils_1.default.deleteFile(ScriptRunner_1.default.filePath);
        }
    });
}
function validateInputs(inlineScript, errorActionPreference) {
    if (!inlineScript.trim()) {
        throw new Error(`inlineScript is empty. Please enter a valid script.`);
    }
    if (azPSVersion !== "latest") {
        if (!Utils_1.default.isValidVersion(azPSVersion)) {
            console.log(`Invalid azPSVersion : ${azPSVersion}. Using latest Az Module version.`);
            azPSVersion = 'latest';
        }
    }
    validateErrorActionPref(errorActionPreference);
}
function validateErrorActionPref(errorActionPreference) {
    if (!(errorActionPrefValues.has(errorActionPreference.toUpperCase()))) {
        throw new Error(`Invalid errorActionPreference: ${errorActionPreference}`);
    }
}
main();
