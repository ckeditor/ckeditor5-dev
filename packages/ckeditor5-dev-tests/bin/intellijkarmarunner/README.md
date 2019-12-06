## Test runner adapter for IntelliJ

To run CKEditor 5 tests integrated into an IntelliJ IDE of your preference, the IDE test runner must be configured to use the adapter provided within the package.

1.  In the IDE, go to _Run_ > _Edit configurations..._:
    1.  Add a new configuration of type "**Karma**".
    2.  Give a name to your configuration, at your preference.
    3.  In "Karma Package", selected the "**node\_modules/ckeditor5-dev-tests/bin/intellijkarmarunner**" directory.
    4.  In "Karma options", input the CKEditor 5 tests arguments. E.g. `--files=ckeditor5`.
    5.  In "Configuration file", selected the "**node\_modules/ckeditor5-dev-tests/bin/intellijkarmarunner/karma.config.js**" file. This configuration file does nothing, but it's necessary to avoid the IDE complaining that there is no configuration file set.
    6.  Save the configuration.

Now just run this configuration directly inside your IntelliJ IDE and the tests will be reported in the IDE itself, including the bells and whistles that the IDE provides.
