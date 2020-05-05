# Github action for Azure PowerShell
This repository contains Github action for Azure PowerShell to automate your github workflows using Azure PowerShell scripts.

Get started today with a [free Azure account](https://azure.com/free/open-source)!

The definition of this Github Action is in [action.yml](https://github.com/azure/powershell/blob/master/action.yml).

## End-to-End Sample Workflows

### Dependencies on other Github Actions

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
      uses: azure/login@v1.1
      with:
        creds: ${{secrets.AZURE_CREDENTIALS}}
        enable-AzPSSession: true 
        
    - uses: azure/powershell@v1
      with:
        inlineScript: |
          Get-AzVM -ResourceGroupName "ResourceGroup11"
        azPSVersion: 'latest'
```
Azure PowerShell Script to be executed can be given under inlineScript as shown in the sample workflow. Az module version to be used can be chosen from the [list](https://docs.microsoft.com/en-us/azure/devops/pipelines/tasks/deploy/azure-powershell?view=azure-devops#error-could-not-find-the-modules--with-version--if-the-module-was-recently-installed-retry-after-restarting-the-azure-pipelines-task-agent). To use the latest version, specify 'latest'.

Both [Azure Login](https://github.com/Azure/login) and [Azure PowerShell](https://github.com/azure/powershell) action uses Az module.

Currently, Azure PowerShell action only supports ubuntu and windows runners. Macos is not supported. 

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
