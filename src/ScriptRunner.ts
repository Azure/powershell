import * as core from '@actions/core';

import FileUtils from "./Utilities/FileUtils";
import PowerShellToolRunner from "./Utilities/PowerShellToolRunner";
import ScriptBuilder from './Utilities/ScriptBuilder';

export default class ScriptRunner {
    inlineScript: string;
    errorActionPreference: string;
    failOnStandardErr: boolean;

    constructor(inlineScript: string, errorActionPreference: string, failOnStandardErr:boolean) {
        this.inlineScript = inlineScript;
        this.errorActionPreference = errorActionPreference;
        this.failOnStandardErr = failOnStandardErr;
    }

    async executeFile() {
        let output: string = "";
        let error: string = "";
        const options: any = {
            listeners: {
                stdout: (data: Buffer) => {
                    output += data.toString();
                },
                stderr: (data: Buffer) => {
                    error += data.toString();
                }
            }
        };
        const filePath: string = await FileUtils.createScriptFile(new ScriptBuilder()
                            .getInlineScriptFile(this.inlineScript, this.errorActionPreference));
        core.debug(`script file to run: ${filePath}`);
        await PowerShellToolRunner.init();
        const exitCode: number = await PowerShellToolRunner.executePowerShellScriptBlock(filePath, options);
        if (exitCode !== 0) {
            core.setOutput(`Azure PowerShell exited with code:`, exitCode.toString());
        }
        if (this.failOnStandardErr) {
            core.setFailed(`Standard error stream contains one or more lines`);
            core.error(error);
        }
    }
}