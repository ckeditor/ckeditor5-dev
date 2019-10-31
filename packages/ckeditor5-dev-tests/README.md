CKEditor 5 testing environment
==============================

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
      "test": "node ./node_modules/.bin/ckeditor5-dev-tests",
      "manual": "node ./node_modules/.bin/ckeditor5-dev-tests-manual"
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
* `disallow-console-use` - Whether to throw an error when one of the console methods (e.g. `console.log()`) is executed.

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

### Rules for converting `--files` option to glob pattern:

| `--file` | Glob | Description |
|----------|------|-------------|
| `engine` | `node_modules/ckeditor5-engine/tests/**/*.js` | |
| `engine/view` | `node_modules/ckeditor5-engine/tests/view/**/*.js` | |
| `engine/view/so/**/me/glob.js` | `node_modules/ckeditor5-engine/tests/view/so/**/me/*glob.js` | |
| `!(engine)` | `node_modules/ckeditor5-!(engine)*/tests/**/*.js` | all tests except of given package(s) – works with multiple names `!(engine|ui|utils)` |
| `*` | `node_modules/ckeditor5-*/tests/**/*.js` | all installed package's tests |
| `ckeditor5` | `tests/**/*.js` | tests from the main repository |

## Changelog

See the [`CHANGELOG.md`](https://github.com/ckeditor/ckeditor5-dev/blob/master/packages/ckeditor5-dev-tests/CHANGELOG.md) file.

## License

Licensed under the terms of [GNU General Public License Version 2 or later](http://www.gnu.org/licenses/gpl.html). For full details about the license, please check the `LICENSE.md` file.
