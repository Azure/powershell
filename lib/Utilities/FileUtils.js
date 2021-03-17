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
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const core = __importStar(require("@actions/core"));
const uuid_1 = require("uuid");
class FileUtils {
    static createScriptFile(inlineScript) {
        return __awaiter(this, void 0, void 0, function* () {
            const fileName = FileUtils.getFileName();
            const filePath = path.join(FileUtils.tempDirectory, fileName);
            fs.writeFileSync(filePath, inlineScript, 'utf-8');
            return filePath;
        });
    }
    static getFileName() {
        return `${uuid_1.v4()}.ps1`;
    }
    static deleteFile(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                }
                catch (err) {
                    core.warning(err.toString());
                }
            }
        });
    }
    static pathExists(path) {
        return fs.existsSync(path);
    }
}
exports.default = FileUtils;
FileUtils.tempDirectory = process.env.RUNNER_TEMP || os.tmpdir();
