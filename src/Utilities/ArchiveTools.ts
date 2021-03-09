import { exec } from "@actions/exec";
import { which } from "@actions/io";
import PowerShellToolRunner from "./PowerShellToolRunner";

export class ArchiveTools {
    private use7Zip: boolean;

    constructor(use7Zip = false) {
        this.use7Zip = use7Zip;
    }

    public async unzip(zipPath: string, destination: string) {
        if (this.use7Zip) {
            await this.unzipUsing7Zip(zipPath, destination);
        } else {
            await this.unzipUsingPowerShell(zipPath, destination)
        }
    }

    private async unzipUsing7Zip(zipPath: string, destination: string) {
        const path7Zip = await which("7z.exe", true);
        const exitCode = await exec(`${path7Zip} x -o${destination} ${zipPath}`);
        if (exitCode != 0) {
            throw new Error(`Extraction using 7zip failed from ${zipPath} to ${destination}`);
        }
    }

    private async unzipUsingPowerShell(zipPath: string, destination: string) {
        const script = `
            $prevProgressPref = $ProgressPreference
            $ProgressPreference = 'SilentlyContinue'
            Expand-Archive -Path ${zipPath} -DestinationPath ${destination}
            $ProgressPreference = $prevProgressPref`;
        PowerShellToolRunner.init();
        const exitCode = await PowerShellToolRunner.executePowerShellScriptBlock(script);
        if (exitCode != 0) {
            throw new Error(`Extraction using Expand-Archive cmdlet failed from ${zipPath} to ${destination}`);
        }
    }
}
