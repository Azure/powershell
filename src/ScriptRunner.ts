import * as core from '@actions/core';
import * as path from 'path';

import FileUtils from "./Utilities/FileUtils";
import PowerShellToolRunner from "./Utilities/PowerShellToolRunner";

export default class ScriptRunner {
    isRunningInlineScript: boolean = false;
    inlineScript: string;
    inputFile: string;
    errorActionPreference: string;
    failOnStandardErr: boolean;

    constructor(inlineScript: string, inputFile: string, errorActionPreference: string, failOnStandardErr: boolean) {
        this.inlineScript = inlineScript;
        this.inputFile = inputFile;
        this.errorActionPreference = errorActionPreference;
        this.failOnStandardErr = failOnStandardErr;
    }

    async executeFile() {
        const error: string[] = [];
        const options: any = {
            listeners: {
                stderr: (data: Buffer) => {
                    if (error.length < 10) {
                        // Truncate to at most 1000 bytes
                        if (data.length > 1000) {
                            error.push(`${data.toString('utf8', 0, 1000)}<truncated>`);
                        } else {
                            error.push(data.toString('utf8'));
                        }
                    } else if (error.length === 10) {
                        error.push('Additional writes to stderr truncated');
                    }
                }
            }
        };
        let filePath: string;
        try {
            filePath = await this.getScriptFile(this.inlineScript, this.inputFile);
            core.debug(`script file to run: ${filePath}`);
            let runnerScript = this.getRunnerScript(filePath, this.errorActionPreference);
            await PowerShellToolRunner.init();
            const exitCode: number = await PowerShellToolRunner.executePowerShellScriptBlock(runnerScript, options);
            if (exitCode !== 0) {
                core.setOutput(`Azure PowerShell exited with code:`, exitCode.toString());
                if (this.failOnStandardErr) {
                    error.forEach((err: string) => {
                        core.error(err);
                    });
                    throw new Error(`Standard error stream contains one or more lines`);
                }
            }

        } finally {
            if (filePath && this.isRunningInlineScript) {
                FileUtils.deleteFile(filePath);
            }
        }
    }

    getScriptFile(inlineScript: string, inputFile: string) {
        if (inlineScript && inlineScript.trim()) {
            this.isRunningInlineScript = true;
            return FileUtils.createScriptFile(inlineScript);
        } else {
            if (inputFile && inputFile.trim()) {
                this.isRunningInlineScript = false;
                return path.join(process.env.GITHUB_WORKSPACE, inputFile);;
            } else {
                throw new Error(`inlineScript and inputFile are both empty. Please enter a valid script or a valid input file.`);
            }
        }
    }

    getRunnerScript(filePath: string, errorActionPreference: string) {
        return `
        $ErrorActionPreference = '${errorActionPreference}'
        ${filePath}
        `;
    }
}