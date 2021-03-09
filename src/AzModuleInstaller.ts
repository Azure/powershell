import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import * as os from 'os';
import { ArchiveTools } from './Utilities/ArchiveTools';
import FileUtils from './Utilities/FileUtils';
import Utils from './Utilities/Utils';

interface InstallResult {
    moduleSource: string;
    isInstalled: boolean;
}

export class AzModuleInstaller {
    private version: string;
    private githubAuth: string;
    private moduleContainerPath: string;
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
        switch(platform) {
            case "windows":
            case "windows_nt":
                this.isWin = true;
                this.moduleContainerPath = "C:\\Modules";
                this.modulePath = `${this.moduleContainerPath}\\az_${this.version}`
                break;
            case "linux":
                this.moduleContainerPath = "/usr/share";
                this.modulePath = `${this.moduleContainerPath}/az_${this.version}`
                break;
            default:
                throw `OS ${platform} not supported`;
        }
        this.moduleZipPath = `${this.modulePath}.zip`;
    }

    public async install(): Promise<InstallResult> {
        if (Utils.isHostedAgent(this.moduleContainerPath)) {
            await this.tryInstallingLatest();
            await this.tryInstallFromFolder();
            await this.tryInstallFromZip();
            await this.tryInstallFromGHRelease();
            await this.tryInstallFromPSGallery();
        } else {
            core.debug("File layout is not like hosted agent, skippig module install.");
            this.installResult = {
                isInstalled: false,
                moduleSource: "privateAgent"
            };
        }

        return this.installResult;
    }

    private async tryInstallingLatest() {
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
    }

    private async tryInstallFromFolder() {
        if (this.installResult.isInstalled) {
            return;
        }

        if (FileUtils.pathExists(this.modulePath)) {
            core.debug(`Az ${this.version} present at ${this.modulePath} as folder.`);
            this.installResult = {
                isInstalled: true,
                moduleSource: "hostedAgentFolder"
            };
        }
    }

    private async tryInstallFromZip() {
        if (this.installResult.isInstalled) {
            return;
        }

        if (FileUtils.pathExists(this.moduleZipPath)) {
            core.debug(`Az ${this.version} present at ${this.moduleZipPath} as zip, expanding it.`);
            await new ArchiveTools(this.isWin).unzip(this.moduleZipPath, this.moduleContainerPath);
            await FileUtils.deleteFile(this.moduleZipPath);
            this.installResult = {
                isInstalled: true,
                moduleSource: "hostedAgentZip"
            };
        }
    }

    private async tryInstallFromGHRelease() {
        if (this.installResult.isInstalled) {
            return;
        }

        try {
            const downloadUrl = await this.getDownloadUrlFromGHRelease();
            core.debug(`Downloading Az ${this.version} from GHRelease using url ${downloadUrl}`);
            await tc.downloadTool(downloadUrl, this.moduleZipPath, this.githubAuth);
            core.debug(`Expanding Az ${this.version} downloaded at ${this.moduleZipPath} as zip.`);
            await new ArchiveTools(this.isWin).unzip(this.moduleZipPath, this.moduleContainerPath);
            await FileUtils.deleteFile(this.moduleZipPath);
            this.installResult = {
                isInstalled: true,
                moduleSource: "hostedAgentGHRelease"
            };
        } catch (err) {
            core.debug(err);
            console.log("Download from GHRelease failed, will fallback to PSGallery");
        }
    }

    private async tryInstallFromPSGallery() {
        if (this.installResult.isInstalled) {
            return;
        }

        await Utils.saveAzModule(this.version, this.modulePath);
        this.installResult = {
            isInstalled: true,
            moduleSource: "hostedAgentPSGallery"
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
        let downloadUrl: string = null;
        if (releaseInfo && releaseInfo.files.length > 0) {
            downloadUrl = releaseInfo.files[0].download_url;
        }

        return downloadUrl
    }
}
