import { AzModuleInstaller } from "../src/AzModuleInstaller";
import FileUtils from "../src/Utilities/FileUtils";
import Utils from "../src/Utilities/Utils";

jest.mock("@actions/core");
jest.mock("@actions/tool-cache");
jest.mock("../src/Utilities/ArchiveTools");

const mockPathExists = jest.fn();
FileUtils.pathExists = mockPathExists;
FileUtils.deleteFile = jest.fn();

const mockIsHostedAgent = jest.fn();
Utils.isHostedAgent = mockIsHostedAgent;
Utils.saveAzModule = jest.fn();

describe("Testing AzModuleInstaller", () => {
    let savedRunnerOS: string;
    beforeAll(() => {
        savedRunnerOS = process.env.RUNNER_OS;
        process.env.RUNNER_OS = "Windows";
    });
    afterAll(() => {
        process.env.RUNNER_OS = savedRunnerOS;
    });

    beforeEach(() => {
        jest.resetAllMocks();
        mockIsHostedAgent.mockReturnValue(true);
        mockPathExists.mockReturnValue(false);
    });

    test("install in case of private agent", async () => {
        mockIsHostedAgent.mockReturnValue(false);
        const installer = new AzModuleInstaller("latest");
        const mockTry = jest.fn();
        installer["tryInstallingLatest"] = mockTry;
        installer["tryInstallFromFolder"] = mockTry;
        installer["tryInstallFromZip"] = mockTry;
        installer["tryInstallFromGHRelease"] = mockTry;
        installer["tryInstallFromPSGallery"] = mockTry;
        const result = await installer.install();
        expect(result).toEqual({ isInstalled: false, moduleSource: "privateAgent" });
        expect(mockTry).not.toBeCalled();
    });
    test("install with latest version", async () => {
        const installer = new AzModuleInstaller("latest");
        const spyTryInstallingLatest = jest.spyOn(<any>installer, "tryInstallingLatest");
        const mockTryInstalledTrue = jest.fn(async () => expect(installer["installResult"]["isInstalled"]).toBeTruthy());
        installer["tryInstallFromFolder"] = mockTryInstalledTrue;
        installer["tryInstallFromZip"] = mockTryInstalledTrue;
        installer["tryInstallFromGHRelease"] = mockTryInstalledTrue;
        installer["tryInstallFromPSGallery"] = mockTryInstalledTrue;
        const result = await installer.install();
        expect(result).toEqual({ isInstalled: true, moduleSource: "hostedAgentFolder" });
        expect(spyTryInstallingLatest).toBeCalledTimes(1);
        expect(mockTryInstalledTrue).toBeCalledTimes(4);
    });
    test("install with version 1.1.1 from GHRelease", async () => {
        const installer = new AzModuleInstaller("1.1.1");
        installer["getDownloadUrlFromGHRelease"] = jest.fn().mockReturnValue("downloadUrl");
        const spyTryInstallingLatest = jest.spyOn(<any>installer, "tryInstallingLatest");
        const spyTryInstallFromFolder = jest.spyOn(<any>installer, "tryInstallFromFolder");
        const spyTryInstallFromZip = jest.spyOn(<any>installer, "tryInstallFromZip");
        const spyTryInstallFromGHRelease = jest.spyOn(<any>installer, "tryInstallFromGHRelease");
        const mockTryInstalledTrue = jest.fn(async () => expect(installer["installResult"]["isInstalled"]).toBeTruthy());
        installer["tryInstallFromPSGallery"] = mockTryInstalledTrue;
        const result = await installer.install();
        expect(result).toEqual({ isInstalled: true, moduleSource: "hostedAgentGHRelease" });
        expect(spyTryInstallingLatest).toBeCalledTimes(1);
        expect(spyTryInstallFromFolder).toBeCalledTimes(1);
        expect(spyTryInstallFromZip).toBeCalledTimes(1);
        expect(spyTryInstallFromGHRelease).toBeCalledTimes(1);
        expect(mockTryInstalledTrue).toBeCalledTimes(1);
    });
    test("install with version 1.1.1 from PSGallery", async () => {
        const installer = new AzModuleInstaller("1.1.1");
        installer["getDownloadUrlFromGHRelease"] = jest.fn().mockRejectedValue(new Error("Error getting versions manifest."));
        const spyTryInstallingLatest = jest.spyOn(<any>installer, "tryInstallingLatest");
        const spyTryInstallFromFolder = jest.spyOn(<any>installer, "tryInstallFromFolder");
        const spyTryInstallFromZip = jest.spyOn(<any>installer, "tryInstallFromZip");
        const spyTryInstallFromGHRelease = jest.spyOn(<any>installer, "tryInstallFromGHRelease");
        const spyTryInstallFromPSGallery = jest.spyOn(<any>installer, "tryInstallFromPSGallery");
        const result = await installer.install();
        expect(result).toEqual({ isInstalled: true, moduleSource: "hostedAgentPSGallery" });
        expect(spyTryInstallingLatest).toBeCalledTimes(1);
        expect(spyTryInstallFromFolder).toBeCalledTimes(1);
        expect(spyTryInstallFromZip).toBeCalledTimes(1);
        expect(spyTryInstallFromGHRelease).toBeCalledTimes(1);
        expect(spyTryInstallFromPSGallery).toBeCalledTimes(1);
    });
});
