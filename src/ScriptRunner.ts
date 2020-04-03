import * as core from '@actions/core';

import FileUtils from "./Utilities/FileUtils";
import PowerShellToolRunner from "./Utilities/PowerShellToolRunner";
import ScriptBuilder from './Utilities/ScriptBuilder';

export default class ScriptRunner {
    static filePath: string;
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
        const options: any = {
            listeners: {
                stdout: (data: Buffer) => {
                    output += data.toString();
                }
            }
        };
        ScriptRunner.filePath = await FileUtils.createScriptFile(new ScriptBuilder()
                            .getInlineScriptFile(this.inlineScript, this.errorActionPreference));
        core.debug(`script file to run: ${ScriptRunner.filePath}`);
        await PowerShellToolRunner.init();
        const exitCode: number = await PowerShellToolRunner.executePowerShellScriptBlock(ScriptRunner.filePath, options);
        if (exitCode !== 0) {
            core.setOutput(`Azure PowerShell exited with code:`, exitCode.toString());
        }
        if (this.failOnStandardErr) {
            throw new Error(`Standard error stream contains one or more lines`);
        }
    }
}