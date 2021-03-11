import { ArchiveTools } from "../../src/Utilities/ArchiveTools";

jest.mock("@actions/core");

describe('Testing ArchiveTools', () => {
    test('unzip using powershell to extract', async () => {
        const archiveTool = new ArchiveTools();
        archiveTool["unzipUsingPowerShell"] = jest.fn();
        archiveTool["unzipUsing7Zip"] = jest.fn();
        await archiveTool.unzip("/usr/share/az_1.1.1.zip", "/usr/share");
        expect(archiveTool["unzipUsingPowerShell"]).toHaveBeenCalledTimes(1);
        expect(archiveTool["unzipUsing7Zip"]).not.toHaveBeenCalled();
    });
    test('unzip using 7zip to extract', async () => {
        const archiveTool = new ArchiveTools(true);
        archiveTool["unzipUsingPowerShell"] = jest.fn();
        archiveTool["unzipUsing7Zip"] = jest.fn();
        await archiveTool.unzip("/usr/share/az_1.1.1.zip", "/usr/share");
        expect(archiveTool["unzipUsingPowerShell"]).not.toHaveBeenCalled();
        expect(archiveTool["unzipUsing7Zip"]).toHaveBeenCalledTimes(1);
    });
});