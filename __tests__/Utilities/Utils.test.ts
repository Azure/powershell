import Utils from '../../src/Utilities/Utils';
import PowerShellToolRunner from '../../src/Utilities/PowerShellToolRunner';

jest.mock('../../src/Utilities/PowerShellToolRunner');
const mockPowerShellToolRunnerInit = jest.fn();
const mockExecutePowerShellCommand = jest.fn();
let mockExecutePowerShellCommandOutput = "";
mockExecutePowerShellCommand.mockImplementation((_script, options) => {
    options.listeners.stdout(Buffer.from(mockExecutePowerShellCommandOutput));
});
let mockExecutePowerShellScriptBlockExitCode = 0;
const mockExecutePowerShellScriptBlock = jest.fn(async (_script) => mockExecutePowerShellScriptBlockExitCode);
PowerShellToolRunner.init = mockPowerShellToolRunnerInit;
PowerShellToolRunner.executePowerShellCommand = mockExecutePowerShellCommand;
PowerShellToolRunner.executePowerShellScriptBlock = mockExecutePowerShellScriptBlock;

const version: string = '9.0.0';
const moduleName: string = 'az';

afterEach(() => {
    jest.restoreAllMocks();
});

describe('Testing isValidVersion', () => {
    const validVersion: string = '1.2.4';
    const invalidVersion: string = 'a.bcd';

    test('isValidVersion should be true', () => {
        expect(Utils.isValidVersion(validVersion)).toBeTruthy();
    });
    test('isValidVersion should be false', () => {
        expect(Utils.isValidVersion(invalidVersion)).toBeFalsy();
    });
});

describe('Testing setPSModulePath', () => {
    let savedRunnerOS: string;
    beforeAll(() => {
        savedRunnerOS = process.env.RUNNER_OS;
    });
    afterAll(() => {
        process.env.RUNNER_OS = savedRunnerOS;
    });

    test('PSModulePath with azPSVersion non-empty', async () => {
        process.env.RUNNER_OS = "Windows";
        await Utils.setPSModulePath(version);
        expect(process.env.PSModulePath).toContain(version);
    });
    test('PSModulePath with azPSVersion empty', async () => {
        process.env.RUNNER_OS = "Linux";
        const prevPSModulePath = process.env.PSModulePath;
        await Utils.setPSModulePath();
        expect(process.env.PSModulePath).not.toEqual(prevPSModulePath);
    });
});

describe('Testing getLatestModule', () => {
    let getLatestModuleSpy;

    beforeEach(() => {
        getLatestModuleSpy = jest.spyOn(Utils, 'getLatestModule');
    });
    test('getLatestModule should pass', async () => {
        getLatestModuleSpy.mockImplementationOnce((_moduleName: string) => Promise.resolve(version));
        await Utils.getLatestModule(moduleName);
        expect(getLatestModuleSpy).toHaveBeenCalled();
    });
});

describe('Testing checkModuleVersion', () => {
    let checkModuleVersionSpy;
    beforeEach(() => {
        checkModuleVersionSpy = jest.spyOn(Utils, 'checkModuleVersion');
    });
    test('checkModuleVersion should pass', async () => {
        checkModuleVersionSpy.mockImplementationOnce((_moduleName: string, _version: string) => Promise.resolve());
        await Utils.checkModuleVersion(moduleName, version);
        expect(checkModuleVersionSpy).toHaveBeenCalled();
    });
});

describe('Testing isHostedAgent', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    
    test('Should return true when file layout check script returns true', async () => {
        mockExecutePowerShellCommandOutput = "True";
        const isHostedAgentResult = await Utils.isHostedAgent("/usr/share");
        expect(mockExecutePowerShellCommand).toHaveBeenCalledTimes(1);
        expect(mockExecutePowerShellCommand.mock.calls[0][0]).toBe('Test-Path (Join-Path "/usr/share" "az_*")');
        expect(isHostedAgentResult).toBeTruthy();
    });
    test('Should return false when file layout check script returns false', async () => {
        mockExecutePowerShellCommandOutput = "False";
        const isHostedAgentResult = await Utils.isHostedAgent("/usr/share");
        expect(isHostedAgentResult).toBeFalsy();
    });
});

describe('Testing isGhes', () => {
    let savedGhUrl: string;
    beforeAll(() => {
        savedGhUrl = process.env['GITHUB_SERVER_URL'];
    });
    afterAll(() => {
        process.env['GITHUB_SERVER_URL'] = savedGhUrl;
    });

    test('Should return false when server url is github.com', () => {
        process.env['GITHUB_SERVER_URL'] = "https://github.com";
        expect(Utils.isGhes()).toBeFalsy();
    });
    test('Should return false when server url is not available', () => {
        process.env['GITHUB_SERVER_URL'] = "";
        expect(Utils.isGhes()).toBeFalsy();
    })
    test('Should return true when server url is not github.com', () => {
        process.env['GITHUB_SERVER_URL'] = "https://github.contoso.com";
        expect(Utils.isGhes()).toBeTruthy();
    });
});

describe('Testing saveAzModule', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    
    test('Should run without throwing when script succeeds with exit code 0', async () => {
        mockExecutePowerShellScriptBlockExitCode = 0;
        await Utils.saveAzModule("1.1.1", "/usr/share/az_1.1.1");
        expect(mockExecutePowerShellScriptBlock).toHaveBeenCalledTimes(1);
        expect(mockExecutePowerShellScriptBlock.mock.calls[0][0]).toContain(
            "Save-Module -Path /usr/share/az_1.1.1 -Name Az -RequiredVersion 1.1.1 -Force -ErrorAction Stop");
    });
    test('Should throw when script fails with non-zero exit code', async () => {
        mockExecutePowerShellScriptBlockExitCode = 1;
        expect(Utils.saveAzModule("1.1.1", "/usr/share/az_1.1.1")).rejects.toThrow();
    });
});
