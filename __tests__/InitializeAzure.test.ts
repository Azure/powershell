import InitializeAzure from '../src/InitializeAzure';

jest.mock('../src/Utilities/Utils');
jest.mock('../src/Utilities/PowerShellToolRunner');

afterEach(() => {
    jest.restoreAllMocks();
});

describe('Testing importAzModule', () => {
    let importAzModuleSpy;
    beforeEach(() => {
        importAzModuleSpy = jest.spyOn(InitializeAzure, 'importAzModule');
    });

    test('InitializeAzure importAzModule should pass', async () => {
        const azVersion: string = '9.0.0';
        await InitializeAzure.importAzModule(azVersion);
        await InitializeAzure.importAzModule('latest');
        expect(importAzModuleSpy).toHaveBeenCalledTimes(2);
    });
});