# Visual Studio Code RHAMT Extension

[![Build Status](https://travis-ci.org/windup/rhamt-vscode-extension.svg?branch=master)](https://travis-ci.org/windup/rhamt-vscode-extension)
[![License](https://img.shields.io/badge/license-MIT-brightgreen.svg)](https://github.com/windup/rhamt-vscode-extension/blob/master/README.md)

The Visual Studio Code extension for the Red Hat Application Migration Toolkit.

> More information about RHAMT can be found [here](https://developers.redhat.com/products/rhamt/overview).

## Features

This extension provides support for performing application migrations using RHAMT.

#### Configuration Wizard
Use the configuration wizard to setup the analysis.  
  
![Configuration Wizard](resources/configuration_wizard.gif)  

#### Jump to Code
Jump to code containing identified migration issues.  
  
![Configuration Wizard](resources/jump_to_code.gif)  

#### Issue Details
View details about the migration issue.  
  
![Configuration Wizard](resources/issue_details.gif)  
  
#### Report
Get a high-level view of the migration.  
  
![Configuration Wizard](resources/report.gif)  

## Requirements

* Java Platform, `JRE version 8+` with `JAVA_HOME` environment variable 
* A minimum of `4 GB RAM`; 8 GB recommended
* Installation of the `rhamt-cli` (downloaded from [here](https://github.com/johnsteele/windup/releases/download/v0.0.1-alpha/rhamt-cli-4.2.0-SNAPSHOT-offline.zip)).

> Tip: You can optionally install the rhamt-cli once the extension has been installed.

## Extension Settings

This extension contributes the following settings:

* `rhamt.executable.path`: The location of the rhamt-cli. 

## Build

```bash
$ npm run compile
```
=======

## License
[MIT](LICENSE)
