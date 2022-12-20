CKEditor 5 testing environment
==============================

[![npm version](https://badge.fury.io/js/%40ckeditor%2Fckeditor5-dev-tests.svg)](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)
[![Build Status](https://travis-ci.com/ckeditor/ckeditor5-dev.svg?branch=master)](https://app.travis-ci.com/github/ckeditor/ckeditor5-dev)
![Dependency Status](https://img.shields.io/librariesio/release/npm/@ckeditor/ckeditor5-dev-tests)

Testing environment for [CKEditor 5](https://ckeditor.com). It's based on [Karma](https://karma-runner.github.io/) and [webpack](https://webpack.github.io/) and it's normally used in the [CKEditor 5 development environment](https://github.com/ckeditor/ckeditor5). Read more about [CKEditor 5's testing environment](https://docs.ckeditor.com/ckeditor5/latest/framework/guides/contributing/testing-environment.html).

More information about development tools packages can be found at the following URL: <https://github.com/ckeditor/ckeditor5-dev>.

## Usage

First, you need to install the package:

```bash
npm i --save-dev @ckeditor/ckeditor5-dev-tests
```

An example npm task to test CKEditor 5 packages (used e.g. in https://github.com/ckeditor/ckeditor5) can look like this:

```json
{
  "scripts": {
      "test": "node ./node_modules/.bin/ckeditor5-dev-tests-run-automated",
      "manual": "node ./node_modules/.bin/ckeditor5-dev-tests-run-manual"
  }
}
```

If you encounter problems with big test folders pass `--max_old_space_size=4096` option to node runner:

```json
{
  "scripts": {
      "test": "node --max_old_space_size=4096 ./node_modules/.bin/ckeditor5-dev-tests-run-automated"
  }
}
```

You can also use the bin script for testing a package:

```bash
# For running all the tests (for the current package and all dependencies).
./node_modules/.bin/ckeditor5-dev-tests --files=*

# For running tests in the current package.
./node_modules/.bin/ckeditor5-dev-tests
```

#### CLI options

* `browsers` - Browsers which will be used to run the tests. Also available as an alias: `-b`.
* `coverage` - Whether to generate code coverage. Also available as an alias: `-c`.
* `debug` - Allows specifying custom debug flags. For example, the `--debug engine` option uncomments the `// @if CK_DEBUG_ENGINE //` lines in the code. By default `--debug` is set to true even if you did not specify it. This enables the base set of debug logs (`// @if CK_DEBUG //`) which should always be enabled in the testing environment. You can completely turn off the debug mode by setting the `--debug false` option or `--no-debug`.
* `files` - Package names, directories or files to tests. Also available as an alias: `-f`. Read more about this option in the [Rules for using the `--files` option](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/contributing/testing-environment.html#rules-for-using-the-files-option) section.
* `language` – Specifies a language that will be used while building tests. By default it is `en`.
* `production` - Run strictest set of checks. E.g. it fails test run when there are [console calls](https://github.com/ckeditor/ckeditor5/issues/1996) or [DOM leaks](https://github.com/ckeditor/ckeditor5/issues/6002).
* `repositories` (`-r`) - Specifies names of repositories containing packages that should be tested. Those repositories should be cloned into the `external/` directory in the root directory of the project. It's a shortcut of the `--files` option as these repository packages' names will be read by the tool automatically.
* `reporter` - Mocha reporter – either `mocha` (default) or `dots` (less verbose one).
* `server` - Whether to run the server without opening any browser.
* `source-map` - Whether to generate the source maps. Also available as an alias: `-s`.
* `verbose` - Whether to informs about Webpack's work. Also available as an alias: `-v`.
* `watch` - Whether to watch the files and executing tests whenever any file changes. Also available as an alias: `-w`.

#### Examples

Test the `ckeditor5-enter` and `ckeditor5-paragraph` packages and generate code coverage report:

```bash
$ npm t -- -c --files=enter,paragraph
```

Run `tests/view/**/*.js` tests from `ckeditor5-engine` and rerun them once any file change (the watch mode):

```bash
$ npm t -- -w --files=engine/view/
```

Test specified files in `ckeditor5-basic-styles` on two browsers (Chrome and Firefox):

```bash
$ npm t -- --browsers=Chrome,Firefox --files=basic-styles/bold,basic-styles/italic
```

Test all installed packages:

```bash
$ npm t -- --files=*
```

Test all installed packages except one (or more):

```bash
$ npm t -- --files='!(engine)'
$ npm t -- --files='!(engine|ui)'
```

## IDE integrations

The CKEditor 5 can be integrated with IDEs via integrations.

Currently only the IntelliJ based IDEs are supported (WebStorm, PHPStorm, etc). Detailed information are provided in [`bin/intellijkarmarunner/README.md`](./bin/intellijkarmarunner/README.md).

## Changelog

See the [`CHANGELOG.md`](https://github.com/ckeditor/ckeditor5-dev/blob/master/packages/ckeditor5-dev-tests/CHANGELOG.md) file.

## License

Licensed under the terms of [GNU General Public License Version 2 or later](http://www.gnu.org/licenses/gpl.html). For full details about the license, please check the `LICENSE.md` file.
