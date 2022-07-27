# Migration Toolkit for Runtimes (MTR) Extension - FAQ

## Requirements

### Available Migration Toolkit for Runtimes (MTR) executable
You can specify the path to an installation of the `mtr-cli` executable from witin the settings:
    ```
    {
        "mtr.executable.path": "/some-path-to-mtr-home/bin/mtr-cli"
    }
    ```

#### Possible error messages
* Unable to find `mtr-cli` executable
    In this case, please follow above instructions to set the `mtr-cli` executable path.
* Unable to determine `mtr-cli` version.
    In this case, please verify the `mtr-cli` exists, is executable, and is a supported version.

### Available Java Runtime (required by mtr-cli)

#### Possible error messages
* `JAVA_HOME` not correctly set.
    ```
    The JAVA_HOME environment variable is not defined correctly
    This environment variable is needed to run this program
    NB: JAVA_HOME should point to a JDK not a JRE
    ```
    In this case, please specify a correct JAVA_HOME environment variable, or re-install JRE/JDK if necessary.