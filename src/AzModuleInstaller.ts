import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import * as os from 'os';
import { ArchiveTools } from './Utilities/ArchiveTools';
import FileUtils from './Utilities/FileUtils';
import Utils from './Utilities/Utils';

export interface InstallResult {
    moduleSource: string;
    isInstalled: boolean;
}

export const AzModuleSource = {
    PrivateAgent: "privateAgent",
    Folder: "hostedAgentFolder",
    Zip: "hostedAgentZip",
    GHRelease: "hostedAgentGHRelease",
    PSGallery: "hostedAgentPSGallery"
}

export class AzModuleInstaller {
    private version: string;
    private githubAuth: string;
    private moduleRoot: string;
    private modulePath: string;
    private moduleZipPath: string;
    private installResult: InstallResult;
    private isWin = false;

    public constructor(version: string, githubAuth?: string) {
        this.version = version;
        this.githubAuth = githubAuth;
        this.installResult = {
            moduleSource: "Others",
            isInstalled: false
        };
        const platform = (process.env.RUNNER_OS || os.type())?.toLowerCase();
        core.debug(`Platform: ${platform}`);
        switch(platform) {
            case "windows":
            case "windows_nt":
                this.isWin = true;
                this.moduleRoot = "C:\\Modules";
                this.modulePath = `${this.moduleRoot}\\az_${this.version}`
                break;
            case "linux":
                this.moduleRoot = "/usr/share";
                this.modulePath = `${this.moduleRoot}/az_${this.version}`
                break;
            default:
                throw `OS ${platform} not supported`;
        }
        this.moduleZipPath = `${this.modulePath}.zip`;
    }

    public async install(): Promise<InstallResult> {
        if (Utils.isHostedAgent(this.moduleRoot)) {
            await this.tryInstallingLatest();
            await this.tryInstallFromFolder();
            await this.tryInstallFromZip();
            await this.tryInstallFromGHRelease();
            await this.tryInstallFromPSGallery();
        } else {
            core.debug("File layout is not like hosted agent, skippig module install.");
            this.installResult = {
                isInstalled: false,
                moduleSource: AzModuleSource.PrivateAgent
            };
        }

        return this.installResult;
    }

    private async tryInstallingLatest() {
        if (this.installResult.isInstalled) {
            core.debug(`Module already installed skipping tryInstallingLatest`);
            return;
        }

        if (this.version === "latest") {
            core.debug("Latest selected, will use latest Az module available in agent as folder.");
            this.installResult = {
                isInstalled: true,
                moduleSource: AzModuleSource.Folder
            };
        }
    }

    private async tryInstallFromFolder() {
        if (this.installResult.isInstalled) {
            core.debug(`Module already installed skipping tryInstallFromFolder`);
            return;
        }

        if (FileUtils.pathExists(this.modulePath)) {
            core.debug(`Az ${this.version} present at ${this.modulePath} as folder.`);
            this.installResult = {
                isInstalled: true,
                moduleSource: AzModuleSource.Folder
            };
        }
    }

    private async tryInstallFromZip() {
        if (this.installResult.isInstalled) {
            core.debug(`Module already installed skipping tryInstallFromZip`);
            return;
        }

        if (FileUtils.pathExists(this.moduleZipPath)) {
            core.debug(`Az ${this.version} present at ${this.moduleZipPath} as zip, expanding it.`);
            await new ArchiveTools(this.isWin).unzip(this.moduleZipPath, this.moduleRoot);
            await FileUtils.deleteFile(this.moduleZipPath);
            this.installResult = {
                isInstalled: true,
                moduleSource: AzModuleSource.Zip
            };
        }
    }

    private async tryInstallFromGHRelease() {
        if (this.installResult.isInstalled) {
            core.debug(`Module already installed skipping tryInstallFromGHRelease`);
            return;
        }

        try {
            const downloadUrl = await this.getDownloadUrlFromGHRelease();
            core.debug(`Downloading Az ${this.version} from GHRelease using url ${downloadUrl}`);
            await tc.downloadTool(downloadUrl, this.moduleZipPath, this.githubAuth);
            core.debug(`Expanding Az ${this.version} downloaded at ${this.moduleZipPath} as zip.`);
            await new ArchiveTools(this.isWin).unzip(this.moduleZipPath, this.moduleRoot);
            await FileUtils.deleteFile(this.moduleZipPath);
            this.installResult = {
                isInstalled: true,
                moduleSource: AzModuleSource.GHRelease
            };
        } catch (err) {
            core.debug(err);
            console.log("Download from GHRelease failed, will fallback to PSGallery");
        }
    }

    private async tryInstallFromPSGallery() {
        if (this.installResult.isInstalled) {
            core.debug(`Module already installed skipping tryInstallFromPSGallery`);
            return;
        }

        await Utils.saveAzModule(this.version, this.modulePath);
        this.installResult = {
            isInstalled: true,
            moduleSource: AzModuleSource.PSGallery
        };
    }

    private async getDownloadUrlFromGHRelease() {
        core.debug("Getting versions manifest from GHRelease.");
        const releases = await tc.getManifestFromRepo(
            "Azure",
            "az-ps-module-versions",
            this.githubAuth,
            "main");
        core.debug(JSON.stringify(releases));
        const releaseInfo = releases.filter(release => release.version === this.version)?.[0];
        if (!releaseInfo || releaseInfo.files.length === 0) {
            throw new Error(`Version ${this.version} not present in versions manifest of GHRelease.`);
        }

        return releaseInfo.files[0].download_url;
    }
}
