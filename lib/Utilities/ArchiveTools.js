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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArchiveTools = void 0;
const core_1 = require("@actions/core");
const exec_1 = require("@actions/exec");
const io_1 = require("@actions/io");
const PowerShellToolRunner_1 = __importDefault(require("./PowerShellToolRunner"));
class ArchiveTools {
    constructor(use7Zip = false) {
        this.use7Zip = use7Zip;
    }
    unzip(zipPath, destination) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.use7Zip) {
                yield this.unzipUsing7Zip(zipPath, destination);
            }
            else {
                yield this.unzipUsingPowerShell(zipPath, destination);
            }
        });
    }
    unzipUsing7Zip(zipPath, destination) {
        return __awaiter(this, void 0, void 0, function* () {
            (0, core_1.debug)(`Using 7zip to extract ${zipPath} to ${destination}`);
            const path7Zip = yield (0, io_1.which)("7z.exe", true);
            const exitCode = yield (0, exec_1.exec)(`${path7Zip} x -o${destination} ${zipPath}`);
            if (exitCode != 0) {
                throw new Error(`Extraction using 7zip failed from ${zipPath} to ${destination}`);
            }
        });
    }
    unzipUsingPowerShell(zipPath, destination) {
        return __awaiter(this, void 0, void 0, function* () {
            (0, core_1.debug)(`Using powershell Expand-Archive cmdlet to extract ${zipPath} to ${destination}`);
            const script = `
            $prevProgressPref = $ProgressPreference
            $ProgressPreference = 'SilentlyContinue'
            Expand-Archive -Path ${zipPath} -DestinationPath ${destination}
            $ProgressPreference = $prevProgressPref`;
            const exitCode = yield PowerShellToolRunner_1.default.executePowerShellScriptBlock(script);
            if (exitCode != 0) {
                throw new Error(`Extraction using Expand-Archive cmdlet failed from ${zipPath} to ${destination}`);
            }
        });
    }
}
exports.ArchiveTools = ArchiveTools;
