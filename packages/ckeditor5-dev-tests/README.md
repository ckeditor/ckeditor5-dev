CKEditor 5 testing environment
==============================

Testing environment for [CKEditor 5](https://ckeditor.com). It's based on [Karma](https://karma-runner.github.io/) and [webpack](https://webpack.github.io/) and it's normally used from the [CKEditor 5 development environment](https://github.com/ckeditor/ckeditor5).

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
      "test": "node ./node_modules/.bin/ckeditor5-dev-tests",
      "test:manual": "node ./node_modules/.bin/ckeditor5-dev-tests-manual"
  }
}
```

If you encounter problems with big test folders pass `--max_old_space_size=4096` option to node runner:

```json
{
  "scripts": {
      "test": "node --max_old_space_size=4096 ./node_modules/.bin/ckeditor5-dev-tests"
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

* `watch` - Whether to watch the files and executing tests whenever any file changes. Also available as an alias: `-w`.
* `source-map` - Whether to generate the source maps. Also available as an alias: `-s`.
* `coverage` - Whether to generate code coverage. Also available as an alias: `-c`.
* `verbose` - Whether to informs about Webpack's work. Also available as an alias: `-v`.
* `files` - Specify file(s) to test. Also available as an alias: `-f`.
* `browsers` - Browsers which will be used to run the tests. Also available as an alias: `-b`.
* `reporter` - Mocha reporter – either `mocha` (default) or `dots` (less verbose one).

#### BrowserStack

You can use BrowserStack to execute the tests on different browsers. At this moment we have defined 2 browsers:

1. Edge 16 - Windows 10 (`BrowserStack_Edge`)
1. Safari 11 - OS X High Sierra (`BrowserStack_Safari`)

In order to run BrowserStack, you need to specify the environment variables: `BROWSER_STACK_USERNAME` and `BROWSER_STACK_ACCESS_KEY`.
By default, the tests will be executed on Chrome that is installed on your machine. You can use an option `--browsers` to specify the browsers.

#### Examples

Test the `ckeditor5-enter` and `ckeditor5-paragraph` packages and generate code coverage report:

```bash
$ npm t -- -c --files=enter,paragraph
```

Run `tests/view/**/*.js` tests from `ckeditor5-engine` and rerun them once any file change (the watch mode):

```bash
$ npm t -- -w --files=engine/view
```

Test specified files in `ckeditor5-basic-styles` on two browsers (Chrome and Firefox) you can use:

```bash
$ npm t -- --browsers=chrome,firefox --files=basic-styles/boldengine.js,basic-styles/italicengine.js
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

Test the `ckeditor5-engine` using BrowserStack on Edge:

```bash
$ BROWSER_STACK_USERNAME=[...] BROWSER_STACK_ACCESS_KEY=[...] npm test -- --files engine --browsers=BrowserStack_Edge
```

Test the `ckeditor5-image` and `ckeditor5-ui` using BrowserStack on Safari and Edge:

```bash
$ BROWSER_STACK_USERNAME=[...] BROWSER_STACK_ACCESS_KEY=[...] npm test -- --files image,ui --browsers=BrowserStack_Safari,BrowserStack_Edge
```

### Rules for converting `--files` option to glob pattern:

| `--file` | Glob | Description |
|----------|------|-------------|
| `engine` | `node_modules/ckeditor5-engine/tests/**/*.js` | |
| `engine/view` | `node_modules/ckeditor5-engine/tests/view/**/*.js` | |
| `engine/view/so/**/me/glob.js` | `node_modules/ckeditor5-engine/tests/view/so/**/me/*glob.js` | |
| `!(engine)` | `node_modules/ckeditor5-!(engine)*/tests/**/*.js` | all tests except of given package(s) – works with multiple names `!(engine|ui|utils)` |
| `*` | `node_modules/ckeditor5-*/tests/**/*.js` | all installed package's tests |
| `/` | `tests/**/*.js` | current package's tests only |

## Changelog

See the [`CHANGELOG.md`](https://github.com/ckeditor/ckeditor5-dev/blob/master/packages/ckeditor5-dev-tests/CHANGELOG.md) file.

## License

Licensed under the terms of [GNU General Public License Version 2 or later](http://www.gnu.org/licenses/gpl.html). For full details about the license, please check the `LICENSE.md` file.
