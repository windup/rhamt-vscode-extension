# Migration Toolkit for Application (MTA) Extension - FAQ

## Requirements

### Available Migration Toolkit for Applications (MTA) executable
You can specify the path to an installation of the `mta-cli` executable from witin the settings:
    ```
    {
        "mta.executable.path": "/some-path-to-mta-home/bin/mta-cli"
    }
    ```

#### Possible error messages
* Unable to find `mta-cli` executable
    In this case, please follow above instructions to set the `mta-cli` executable path.
* Unable to determine `mta-cli` version.
    In this case, please verify the `mta-cli` exists, is executable, and is a supported version.

### Available Java Runtime (required by mta-cli)

#### Possible error messages
* `JAVA_HOME` not correctly set.
    ```
    The JAVA_HOME environment variable is not defined correctly
    This environment variable is needed to run this program
    NB: JAVA_HOME should point to a JDK not a JRE
    ```
    In this case, please specify a correct JAVA_HOME environment variable, or re-install JRE/JDK if necessary.