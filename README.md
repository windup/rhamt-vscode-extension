# Migration Toolkit for Applications (MTR) Visual Studio Code Extension

[![License](https://img.shields.io/badge/license-MIT-brightgreen.svg)](https://github.com/windup/rhamt-vscode-extension/blob/master/README.md)
[![Visual Studio Marketplace](https://vsmarketplacebadge.apphb.com/version/redhat.mta-vscode-extension.svg)](https://marketplace.visualstudio.com/items?itemName=redhat.mta-vscode-extension)
[![Visual Studio Marketplace](https://vsmarketplacebadge.apphb.com/installs/redhat.mta-vscode-extension.svg)](https://marketplace.visualstudio.com/items?itemName=redhat.mta-vscode-extension)
[![Visual Studio Marketplace](https://vsmarketplacebadge.apphb.com/downloads-short/redhat.mta-vscode-extension.svg)](https://marketplace.visualstudio.com/items?itemName=redhat.mta-vscode-extension)
## Description

VSCode extension for application migration and modernization using [Windup](https://github.com/windup/windup)).

## VSCode

This extension is published [here](https://marketplace.visualstudio.com/items?itemName=redhat.mta-vscode-extension) in the Microsoft Visual Studio Marketplace.

![VSCode Extension Marketplace View](resources/mta_vscode_installation.png)

## Features

This extension provides the ability to analyze, assess, and migrate source code (using MTR) from within VSCode and Eclipse Che.

The look and feel of both VSCode and Eclipse Che are very similar; therefore, the functionality demonstrated below should be consistent between the two environments.

#### Configuration Editor
Use the configuration editor to setup the analysis.  
  
![Configuration Editor](resources/configuration_editor.gif)  

#### Jump to Code
Jump to code containing identified migration issues.  
  
![Configuration Wizard](resources/jump_to_code.gif)  

#### Issue Details
View details about the migration issue.  
  
![Configuration Wizard](resources/issue_details.gif)  
  
#### Report
Use the generated reports to better understand and assess the migration efforts.  
  
![Configuration Wizard](resources/report.gif)  

## Eclipse Che

This extension is supported in [Eclipse Che](https://www.eclipse.org/che/).

To add this plugin to a Che workspace, open Che, navigate to the plugins tab, and search using the keyword `migration`.

Alternatively, to add this plugin to a worksace, open Che, navigate to the Plugins view, and search for the `Migration Toolkit for Applications` plugin.

## Requirements

* Java Platform, `JRE version 11` with `JAVA_HOME` environment variable 
* A minimum of `4 GB RAM`; 8 GB recommended

> Tip: The cli can be installed from within VSCode once the extension has been installed.

## Extension Settings

This extension contributes the following settings:

* `cli.executable.path`: The location of the cli.

## Build

```bash
$ npm run compile
```
=======

## License
[MIT](LICENSE)
