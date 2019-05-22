# RHAMT Extension - FAQ

## Requirements

### Available RHAMT executable
You can specify the path to an installation of the `rhamt-cli` executable from witin the settings:
    ```
    {
        "rhamt.executable.path": "/some-path-to-rhamt-home/bin/rhamt-cli"
    }
    ```

#### Possible error messages
* Unable to find `rhamt-cli` executable
    In this case, please follow above instructions to set the `rhamt-cli` executable path.
* Unable to determine `rhamt-cli` version.
    In this case, please verify the `rhamt-cli` exists, is executable, and is a supported version.

### Available Java Runtime (required by rhamt-cli)

#### Possible error messages
* `JAVA_HOME` not correctly set.
    ```
    The JAVA_HOME environment variable is not defined correctly
    This environment variable is needed to run this program
    NB: JAVA_HOME should point to a JDK not a JRE
    ```
    In this case, please specify a correct JAVA_HOME environment variable, or re-install JRE/JDK if necessary.