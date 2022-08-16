# Migration Toolkit for Runtimes (MTR) Extension - FAQ

## Requirements

### Available Windup executable
You can specify the path to an installation of the `windup-cli` executable from witin the settings:
    ```
    {
        "windup.executable.path": "/some-path-to-windup-home/bin/windup-cli"
    }
    ```

#### Possible error messages
* Unable to find `windup-cli` executable
    In this case, please follow above instructions to set the `windup-cli` executable path.
* Unable to determine `windup-cli` version.
    In this case, please verify the `windup-cli` exists, is executable, and is a supported version.

### Available Java Runtime (required by windup-cli)

#### Possible error messages
* `JAVA_HOME` not correctly set.
    ```
    The JAVA_HOME environment variable is not defined correctly
    This environment variable is needed to run this program
    NB: JAVA_HOME should point to a JDK not a JRE
    ```
    In this case, please specify a correct JAVA_HOME environment variable, or re-install JRE/JDK if necessary.