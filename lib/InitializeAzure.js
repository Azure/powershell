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
const Constants_1 = __importDefault(require("./Constants"));
class InitializeAzure {
    static importAzModule(azPSVersion) {
        return __awaiter(this, void 0, void 0, function* () {
            Utils_1.default.setPSModulePath();
            if (azPSVersion === "latest") {
                azPSVersion = yield Utils_1.default.getLatestModule(Constants_1.default.moduleName);
            }
            else {
                Utils_1.default.checkModuleVersion(Constants_1.default.moduleName, azPSVersion);
            }
            core.debug(`Az Module version used: ${azPSVersion}`);
            Utils_1.default.setPSModulePath(`${Constants_1.default.prefix}${azPSVersion}`);
        });
    }
}
exports.default = InitializeAzure;
