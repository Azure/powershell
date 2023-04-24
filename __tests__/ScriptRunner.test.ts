import ScriptRunner from '../src/ScriptRunner';
import FileUtils from '../src/Utilities/FileUtils';
import * as path from 'path';

jest.mock('../src/Utilities/FileUtils');
jest.mock('../src/Utilities/PowerShellToolRunner');
jest.mock('../src/Utilities/ScriptBuilder');
let scriptRunner: ScriptRunner;

const mockCreateScriptFile = jest.fn();
mockCreateScriptFile.mockImplementation((inlineScript) => {
    return "/temp/" + inlineScript;
});
FileUtils.createScriptFile = mockCreateScriptFile;

process.env['GITHUB_WORKSPACE'] = 'githubrepo';

beforeAll(() => {
    scriptRunner = new ScriptRunner("inlineScript","inputFile", "Stop", true);
});

afterEach(() => {
    jest.restoreAllMocks();
});


describe('Testing ScriptRunner', () => {
    let executeFileSpy;
    beforeEach(() => {
        executeFileSpy = jest.spyOn(scriptRunner, 'executeFile');
    });
    test('executeFile should pass', async () => {
        executeFileSpy.mockImplementationOnce(() => Promise.resolve());
        await scriptRunner.executeFile();
        expect(executeFileSpy).toHaveBeenCalled();
    });

    test('getScriptFile with inlineScript', () => {
        expect(scriptRunner.getScriptFile("script", "")).toBe("/temp/script");
    });

    test('getScriptFile with inputfile', () => {
        const inputFile = "inputfile.ps1";
        const expectFilePath:string = path.join('githubrepo', inputFile);
        expect(scriptRunner.getScriptFile("", inputFile)).toBe(expectFilePath);
    });

    test('getRunnerScript should pass', () => {
        const expectedResult = `
        $ErrorActionPreference = 'stop'
        test.ps1
        `;
        expect(scriptRunner.getRunnerScript("test.ps1", "stop")).toBe(expectedResult);
    });
});