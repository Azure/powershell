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
const tc = __importStar(require("@actions/tool-cache"));
const os = __importStar(require("os"));
const ArchiveTools_1 = require("./Utilities/ArchiveTools");
const FileUtils_1 = __importDefault(require("./Utilities/FileUtils"));
const Utils_1 = __importDefault(require("./Utilities/Utils"));
class AzModuleInstaller {
    constructor(version, githubAuth) {
        var _a;
        this.isWin = false;
        this.version = version;
        this.githubAuth = githubAuth;
        this.installResult = {
            moduleSource: "Others",
            isInstalled: false
        };
        const platform = (_a = (process.env.RUNNER_OS || os.type())) === null || _a === void 0 ? void 0 : _a.toLowerCase();
        switch (platform) {
            case "windows":
            case "windows_nt":
                this.isWin = true;
                this.moduleContainerPath = "C:\\Modules";
                this.modulePath = `${this.moduleContainerPath}\\az_${this.version}`;
                break;
            case "linux":
                this.moduleContainerPath = "/usr/share";
                this.modulePath = `${this.moduleContainerPath}/az_${this.version}`;
                break;
            default:
                throw `OS ${platform} not supported`;
        }
        this.moduleZipPath = `${this.modulePath}.zip`;
    }
    install() {
        return __awaiter(this, void 0, void 0, function* () {
            if (Utils_1.default.isHostedAgent(this.moduleContainerPath)) {
                yield this.tryInstallingLatest();
                yield this.tryInstallFromFolder();
                yield this.tryInstallFromZip();
                yield this.tryInstallFromGHRelease();
                yield this.tryInstallFromPSGallery();
            }
            else {
                core.debug("File layout is not like hosted agent, skippig module install.");
                this.installResult = {
                    isInstalled: false,
                    moduleSource: "privateAgent"
                };
            }
            return this.installResult;
        });
    }
    tryInstallingLatest() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.installResult.isInstalled) {
                return;
            }
            if (this.version === "latest") {
                core.debug("Latest selected, will use latest Az module available in agent as folder.");
                this.installResult = {
                    isInstalled: true,
                    moduleSource: "hostedAgentFolder"
                };
            }
        });
    }
    tryInstallFromFolder() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.installResult.isInstalled) {
                return;
            }
            if (FileUtils_1.default.pathExists(this.modulePath)) {
                core.debug(`Az ${this.version} present at ${this.modulePath} as folder.`);
                this.installResult = {
                    isInstalled: true,
                    moduleSource: "hostedAgentFolder"
                };
            }
        });
    }
    tryInstallFromZip() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.installResult.isInstalled) {
                return;
            }
            if (FileUtils_1.default.pathExists(this.moduleZipPath)) {
                core.debug(`Az ${this.version} present at ${this.moduleZipPath} as zip, expanding it.`);
                yield new ArchiveTools_1.ArchiveTools(this.isWin).unzip(this.moduleZipPath, this.moduleContainerPath);
                yield FileUtils_1.default.deleteFile(this.moduleZipPath);
                this.installResult = {
                    isInstalled: true,
                    moduleSource: "hostedAgentZip"
                };
            }
        });
    }
    tryInstallFromGHRelease() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.installResult.isInstalled) {
                return;
            }
            try {
                const downloadUrl = yield this.getDownloadUrlFromGHRelease();
                core.debug(`Downloading Az ${this.version} from GHRelease using url ${downloadUrl}`);
                yield tc.downloadTool(downloadUrl, this.moduleZipPath, this.githubAuth);
                core.debug(`Expanding Az ${this.version} downloaded at ${this.moduleZipPath} as zip.`);
                yield new ArchiveTools_1.ArchiveTools(this.isWin).unzip(this.moduleZipPath, this.moduleContainerPath);
                yield FileUtils_1.default.deleteFile(this.moduleZipPath);
                this.installResult = {
                    isInstalled: true,
                    moduleSource: "hostedAgentGHRelease"
                };
            }
            catch (err) {
                core.debug(err);
                console.log("Download from GHRelease failed, will fallback to PSGallery");
            }
        });
    }
    tryInstallFromPSGallery() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.installResult.isInstalled) {
                return;
            }
            yield Utils_1.default.saveAzModule(this.version, this.modulePath);
            this.installResult = {
                isInstalled: true,
                moduleSource: "hostedAgentPSGallery"
            };
        });
    }
    getDownloadUrlFromGHRelease() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            core.debug("Getting versions manifest from GHRelease.");
            const releases = yield tc.getManifestFromRepo("Azure", "az-ps-module-versions", this.githubAuth, "main");
            core.debug(JSON.stringify(releases));
            const releaseInfo = (_a = releases.filter(release => release.version === this.version)) === null || _a === void 0 ? void 0 : _a[0];
            let downloadUrl = null;
            if (releaseInfo && releaseInfo.files.length > 0) {
                downloadUrl = releaseInfo.files[0].download_url;
            }
            return downloadUrl;
        });
    }
}
exports.AzModuleInstaller = AzModuleInstaller;
