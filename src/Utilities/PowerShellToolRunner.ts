import * as io from '@actions/io';
import * as exec from '@actions/exec';

export default class PowerShellToolRunner {
    static psPath: string;

    static async init() {
        if(!PowerShellToolRunner.psPath) {
            PowerShellToolRunner.psPath = await io.which("pwsh", true);
        }
    }

    static async executePowerShellCommand(command: string, options: any = {}) {
        await exec.exec(`${PowerShellToolRunner.psPath} -Command ${command}`, [], options);
    }

    static async executePowerShellFile(filePath: string, options: any = {}) {
        await exec.exec(`${PowerShellToolRunner.psPath} -File ${filePath}`, [], options);
    }
    
    static async executePowerShellScriptBlock(scriptBlock: string, options: any = {}): Promise<number> {
        const exitCode: number = await exec.exec(`${PowerShellToolRunner.psPath} -Command`, [scriptBlock], options)
        return exitCode;
    }
}