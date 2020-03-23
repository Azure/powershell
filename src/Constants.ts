export default class Constants {
    static readonly prefix: string = "az_";
    static readonly moduleName: string = "Az";

    static readonly pattern = /[\n;]+/;
    static readonly versionPattern = /[0-9]\.[0-9]\.[0-9]/;

    static readonly Success: string = "Success";
    static readonly Error: string = "Error";
    static readonly AzVersion: string = "AzVersion";
    static readonly doesVersionExist: string = "doesVersionExist";
}