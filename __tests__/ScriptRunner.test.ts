import ScriptRunner from '../src/ScriptRunner';

jest.mock('../src/Utilities/FileUtils');
jest.mock('../src/Utilities/PowerShellToolRunner');
jest.mock('../src/Utilities/ScriptBuilder');
let scriptRunner: ScriptRunner;

beforeAll(() => {
    scriptRunner = new ScriptRunner("inlineScript", "Stop", true);
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
});