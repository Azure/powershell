import * as core from '@actions/core';

import Utils from "./Utilities/Utils";
import Constants from "./Constants";

export default class InitializeAzure {
    static async importAzModule(azPSVersion: string) {
        Utils.setPSModulePath();
        if (azPSVersion === "latest") {
            azPSVersion = await Utils.getLatestModule(Constants.moduleName);
        } else {
            Utils.checkModuleVersion(Constants.moduleName, azPSVersion);
        }
        core.debug(`Az Module version used: ${azPSVersion}`);
        Utils.setPSModulePath(`${Constants.prefix}${azPSVersion}`);
    }
}