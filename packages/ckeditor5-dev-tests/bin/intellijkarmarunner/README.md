# Test runner adapter for IntelliJ

This runner allows to benefit from integrated testing environment inside your IDE. With proper setup you can
- run pre-defined set of tests (group of packages)
- run any tests right from the editor
- run tests in debug mode inside IDE
- run tests with coverage

In order to run CKEditor 5 tests integrated into an IntelliJ IDE of your preference (WebStorm, PHPStorm, etc) you need to have [`Karma`](https://plugins.jetbrains.com/plugin/7287-karma/) plugin installed.

## Basic run configuration

Use this configuration for running tests as you would use `--files` directive:

```bash
yarn run test --files=engine,basic-styles
```

1. In the IDE, go to _Run_ > _Edit configurations..._:
1. Add a new configuration of type "**Karma**" and a name of your preference.
1. In "Configuration file", selected the "**node\_modules/ckeditor5-dev-tests/bin/intellijkarmarunner/karma.config.js**" file.
1. In "Karma Package", selected the "**node\_modules/ckeditor5-dev-tests/bin/intellijkarmarunner**" directory.
1. In "Karma options", input the CKEditor 5 tests arguments. E.g. `--files=engine,basic-styles`.
1. In "Working directory", select the base `ckeditor5` directory.
1. In "Test name", select the "All tests" option.
1. Save the configuration.

**Note**: This `karma.config.js` configuration file does nothing, but it's necessary to avoid the IDE complaining that there is no configuration file set.

Now just run this configuration directly inside your IntelliJ IDE and the tests will be reported in the IDE itself, including the bells and whistles that the IDE provides.

## Enabling IDE integrations

## Running single test or test suite

The IntelliJ IDE provides a way to run single file or a suite using icons in the left gutter of the editing window. To enable the Karma configuration template must be changed.

1. In the IDE, go to _Run_ > _Edit configurations..._:
1. Select the _Templates_ > "**Karma**".
1. In "Configuration file", selected the "**node\_modules/ckeditor5-dev-tests/bin/intellijkarmarunner/karma.config.js**" file.
1. In "Karma Package", selected the "**node\_modules/ckeditor5-dev-tests/bin/intellijkarmarunner**" directory.
1. In "Karma options", input the CKEditor 5 tests arguments `-sc` to enable code navigation and coverage.
1. In "Working directory", select the base `ckeditor5` directory.
1. In "Test name", select the "Test" option.
1. Save the template.

**Note** The coverage will only be collected when using the "Run with coverage".

**Note** This will create a temporary run configuration which you can save .

### Using code navigation from the test output window

It is convenient to directly navigate from a failed test output message containing stack trace. To enable that use `-s` sourcemap switch when defining new configuration to "Karma options" field.

### Running tests with coverage

To run tests with coverage (`yarn run test -c`) add the `-c` switch when defining new configuration to "Karma options" field.

**Note**: Must be combined with `-s` switch to display the coverage in files inside IDE.
