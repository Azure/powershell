# GitHub action for Azure PowerShell
This repository contains GitHub action for Azure PowerShell to automate your GitHub workflows using Azure PowerShell scripts.

Get started today with a [free Azure account](https://azure.com/free/open-source)!

The definition of this GitHub Action is in [action.yml](https://github.com/azure/powershell/blob/master/action.yml).

## End-to-End Sample Workflow

### Dependencies on other GitHub Actions

Login to Azure before running Azure PowerShell scripts using [Azure Login](https://github.com/Azure/login). Refer [Azure Login](https://github.com/Azure/login#configure-azure-credentials) action on how to configure Azure credentials.

Once login is done, Azure PowerShell action will use the same session to run the script. 

#### Sample workflow to run inlinescript using Azure PowerShell
```yaml
on: [push]

name: AzurePowerShellSample

jobs:

  build:
    runs-on: ubuntu-latest
    steps:
    
    - name: Login via Az module
      uses: azure/login@v1
      with:
        creds: ${{secrets.AZURE_CREDENTIALS}}
        enable-AzPSSession: true 
        
    - name: Run Azure PowerShell script
      uses: azure/powershell@v1
      with:
        inlineScript: |
          Get-AzVM -ResourceGroupName "ResourceGroup11"
        azPSVersion: '3.1.0'
```
Azure PowerShell Script to be executed can be given under inlineScript as shown in the sample workflow.

Both [Azure Login](https://github.com/Azure/login) and [Azure PowerShell](https://github.com/azure/powershell) action uses Az module.

Currently, Azure PowerShell action only supports ubuntu and windows runners. MacOS is not supported. Self hosted runners are not supported.

Azure PowerShell action is now supported for the Azure public cloud as well as Azure government clouds ('AzureUSGovernment' or 'AzureChinaCloud') and Azure Stack ('AzureStack') Hub. Before running Azure PowerShell scripts, login to the respective Azure Cloud  using [Azure Login](https://github.com/Azure/login) by setting appropriate value for the `environment` parameter.

Additionally the action supports two optional parameters 
- `errorActionPreference` : select a suitable  value for the variable for executing the script. Allowed values are `stop`, `continue`, `silentlyContinue`. Default is `Stop`.
- `failOnStandardError` : By default this is marked as `false`. But if this is marked as `true`, the action will fail if any errors are written to the error pipeline, or if any data is written to the Standard Error stream.

### Sample workflow to run Azure powershell actions in Azure US Government cloud

```
   .......
   .......
   .......
   
   - name: Login to Azure US Gov Cloud with Az Powershell 
        uses: azure/login@releases/azcloud-v1
        with:
          creds: ${{ secrets.AZURE_US_GOV_CREDENTIALS }}
          environment: 'AzureUSGovernment'
          enable-AzPSSession: true
    
      - name: Run powershell command in US Gov Cloud
        uses: azure/powershell@v1
        with:
          inlineScript: "Get-AzContext"
          azPSVersion: "latest"
```

#### Available versions of Az Module on runner

To use the latest Az module version, specify 'latest'. You can find the list of Az module versions that can be given as azPSVersion from the following table.

| Environment | YAML Label | Az module versions
| --------------------|---------------------|--------------------
| Ubuntu 18.04 | `ubuntu-latest` or `ubuntu-18.04` | [ubuntu-18.04](https://github.com/actions/virtual-environments/blob/master/images/linux/Ubuntu1804-README.md)
| Ubuntu 16.04 | `ubuntu-16.04` | [ubuntu-16.04](https://github.com/actions/virtual-environments/blob/master/images/linux/Ubuntu1604-README.md)
| Windows Server 2019 | `windows-latest` or `windows-2019` | [windows-2019](https://github.com/actions/virtual-environments/blob/master/images/win/Windows2019-Readme.md#az-powershell-module)
| Windows Server 2016 | `windows-2016` | [windows-2016](https://github.com/actions/virtual-environments/blob/master/images/win/Windows2016-Readme.md#az-powershell-module)

##### Note:
For ubuntu-18.04 and ubuntu-16.04 runners, please search for the az module in the software page to see the versions.

# Getting Help for Azure PowerShell Issues

If you encounter an issue related to the Azure PowerShell commands executed in your script, you can 
file an issue directly on the [Azure PowerShell repository](https://github.com/Azure/azure-powershell/issues/new/choose).

# Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
