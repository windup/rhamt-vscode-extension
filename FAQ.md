# VSCode extension for application migration and modernization - FAQ

## Requirements

### Available CLI executable
You can specify the path to an installation of the `cli` from witin the settings:
    ```
    {
        "cli.executable.path": "/some-path-to-cli-home/bin/cli"
    }
    ```

#### Possible error messages
* Unable to find `cli` executable
    In this case, please follow above instructions to set the `cli` executable path.
* Unable to determine `cli` version.
    In this case, please verify the `cli` exists, is executable, and is a supported version.

### Available Java Runtime (required by the cli)

#### Possible error messages
* `JAVA_HOME` not correctly set.
    ```
    The JAVA_HOME environment variable is not defined correctly
    This environment variable is needed to run this program
    NB: JAVA_HOME should point to a JDK not a JRE
    ```
    In this case, please specify a correct JAVA_HOME environment variable, or re-install JRE/JDK if necessary.