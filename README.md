# Migration Toolkit for Applications (MTA) Visual Studio Code Extension

[![Build Status](https://travis-ci.org/windup/rhamt-vscode-extension.svg?branch=master)](https://travis-ci.org/windup/rhamt-vscode-extension)
[![License](https://img.shields.io/badge/license-MIT-brightgreen.svg)](https://github.com/windup/rhamt-vscode-extension/blob/master/README.md)
[![Visual Studio Marketplace](https://vsmarketplacebadge.apphb.com/version/redhat.rhamt-vscode-extension.svg)](https://marketplace.visualstudio.com/items?itemName=redhat.rhamt-vscode-extension)
[![Visual Studio Marketplace](https://vsmarketplacebadge.apphb.com/installs/redhat.rhamt-vscode-extension.svg)](https://marketplace.visualstudio.com/items?itemName=redhat.rhamt-vscode-extension)
[![Visual Studio Marketplace](https://vsmarketplacebadge.apphb.com/downloads-short/redhat.rhamt-vscode-extension.svg)](https://marketplace.visualstudio.com/items?itemName=redhat.rhamt-vscode-extension)
## Description

The Visual Studio Code (VSCode) and Eclipse Che extension for the <b>Migration Toolkit for Applications</b> (MTA).

Migration Toolkit for Applications (MTA) (the product of the downstream project [Windup](https://github.com/windup/windup)) is a command-line Application Migration and Modernization Assessment tool.

> The documentation for MTA can be found [here](https://developers.redhat.com/products/rhamt/overview).

## VSCode

This extension is published [here](https://marketplace.visualstudio.com/items?itemName=redhat.rhamt-vscode-extension) in the Microsoft Visual Studio Marketplace.

To add this extension to a VSCode installation, open VSCode, navigate to the Extensions Marketplace View, and search using the keyword `mta`.

![VSCode Extension Marketplace View](resources/rhamt_vscode_installation.png)

## Features

This extension provides the ability to analyze, assess, and migrate source code (using MTA) from within VSCode and Eclipse Che.

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

This extension is supported in [Eclipse Che](https://www.eclipse.org/che/) `7.4.0` or higher.

To add this plugin to a Che workspace, open Che, navigate to the plugins tab, and search using the keyword `migration`.

![Eclipse Che Plugin](resources/rhamt_che_installation.png)

Alternatively, to add this plugin to a worksace, open Che, navigate to the Plugins view, and search for the `Migration Toolkit for Applications` plugin.

![Eclipse Che Plugin](resources/rhamt_che_installation_view.png)

## Requirements

* Java Platform, `JRE version 8+` with `JAVA_HOME` environment variable 
* A minimum of `4 GB RAM`; 8 GB recommended

> Tip: The rhamt-cli can be installed from within VSCode once the extension has been installed.

## Extension Settings

This extension contributes the following settings:

* `mta.executable.path`: The location of the mta-cli.

## Build

```bash
$ npm run compile
```
=======

## License
[MIT](LICENSE)
