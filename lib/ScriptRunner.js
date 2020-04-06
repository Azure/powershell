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
const FileUtils_1 = __importDefault(require("./Utilities/FileUtils"));
const PowerShellToolRunner_1 = __importDefault(require("./Utilities/PowerShellToolRunner"));
const ScriptBuilder_1 = __importDefault(require("./Utilities/ScriptBuilder"));
class ScriptRunner {
    constructor(inlineScript, errorActionPreference, failOnStandardErr) {
        this.inlineScript = inlineScript;
        this.errorActionPreference = errorActionPreference;
        this.failOnStandardErr = failOnStandardErr;
    }
    executeFile() {
        return __awaiter(this, void 0, void 0, function* () {
            let output = "";
            const error = [];
            const options = {
                outStream: process.stdout,
                errStream: process.stderr,
                listeners: {
                    stdout: (data) => {
                        output += data.toString();
                    },
                    stderr: (data) => {
                        if (error.length < 10) {
                            // Truncate to at most 1000 bytes
                            if (data.length > 1000) {
                                error.push(`${data.toString('utf8', 0, 1000)}<truncated>`);
                            }
                            else {
                                error.push(data.toString('utf8'));
                            }
                        }
                        else if (error.length === 10) {
                            error.push('Additional writes to stderr truncated');
                        }
                    }
                }
            };
            const scriptToExecute = new ScriptBuilder_1.default().getInlineScriptFile(this.inlineScript, this.errorActionPreference);
            ScriptRunner.filePath = yield FileUtils_1.default.createScriptFile(scriptToExecute);
            core.debug(`script file to run: ${ScriptRunner.filePath}`);
            yield PowerShellToolRunner_1.default.init();
            const exitCode = yield PowerShellToolRunner_1.default.executePowerShellScriptBlock(ScriptRunner.filePath, options);
            if (exitCode !== 0) {
                core.setOutput(`Azure PowerShell exited with code:`, exitCode.toString());
                if (this.failOnStandardErr) {
                    error.forEach((err) => {
                        core.error(err);
                    });
                    throw new Error(`Standard error stream contains one or more lines`);
                }
            }
        });
    }
}
exports.default = ScriptRunner;
