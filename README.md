# Visual Studio Code RHAMT Extension

[![Build Status](https://travis-ci.org/windup/rhamt-vscode-extension.svg?branch=master)](https://travis-ci.org/windup/rhamt-vscode-extension)
[![License](https://img.shields.io/badge/license-MIT-brightgreen.svg)](https://github.com/windup/rhamt-vscode-extension/blob/master/README.md)

The Visual Studio Code extension for the Red Hat Application Migration Toolkit.

> More information about RHAMT can be found [here](https://developers.redhat.com/products/rhamt/overview).

## Features

This extension provides support for performing application migrations using RHAMT.

## Requirements

* Java Platform, `JRE version 8+` with `JAVA_HOME` environment variable 
* A minimum of `4 GB RAM`; 8 GB recommended
* Installation of the `rhamt-cli` (downloaded from [here](https://github.com/johnsteele/rhamt-vscode-extension-fork/releases/download/v0.0.1-alpha/rhamt-cli-4.2.0-SNAPSHOT-offline.zip)).

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
