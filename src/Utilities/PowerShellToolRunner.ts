import * as io from '@actions/io';
import * as exec from '@actions/exec';

export default class PowerShellToolRunner {
    static psPath: string;
    static args: string[] = ['-NoLogo', '-NoProfile', '-NonInteractive'];

    static async init() {
        if(!PowerShellToolRunner.psPath) {
            PowerShellToolRunner.psPath = await io.which("pwsh", true);
        }
    }

    static async executePowerShellCommand(command: string, options: any = {}) {
        await exec.exec(`${PowerShellToolRunner.psPath} -Command ${command}`, PowerShellToolRunner.args, options);
    }

    static async executePowerShellScriptBlock(scriptBlock: string, options: any = {}): Promise<number> {
        PowerShellToolRunner.args.push(scriptBlock);
        const exitCode: number = await exec.exec(`${PowerShellToolRunner.psPath} -Command`,
                     PowerShellToolRunner.args, options);
        return exitCode;
    }
}