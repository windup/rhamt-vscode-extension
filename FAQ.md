# RHAMT Extension - FAQ

## Requirements

### Available windup-web executable
You can specify the path to an installation of the `windup-web` executable from witin the settings:
    ```
    {
        "rhamt.executable.path": "/some-path-to-windup-web/run_rhamt"
    }
    ```

#### Possible error messages
* `windup-web` executable file not found/set.
    In this case, please follow above instructions to set available `windup-web` executable path.


* `RHAMT_HOME` not correctly set.
    In this case, please specify a correct `RHAMT_HOME` environment variable.

### Available Java Runtime (required by rhamt-cli)

#### Possible error messages
* `JAVA_HOME` not correctly set.
    ```
    The JAVA_HOME environment variable is not defined correctly
    This environment variable is needed to run this program
    NB: JAVA_HOME should point to a JDK not a JRE
    ```
    In this case, please specify a correct JAVA_HOME environment variable, or re-install JRE/JDK if necessary.