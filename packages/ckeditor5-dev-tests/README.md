CKEditor 5 testing environment
==============================

Testing environment for [CKEditor 5](https://ckeditor5.github.io). It's based on [Karma](https://karma-runner.github.io/) and [Webpack](https://webpack.github.io/) and it's normally used from the [CKEditor 5 development environment](https://github.com/ckeditor/ckeditor5).

More information about development tools packages can be found at the following URL: <https://github.com/ckeditor/ckeditor5-dev>.

## Usage

First, you need to install the package:

```bash
npm i --save-dev @ckeditor/ckeditor5-dev-tests
```

An example [gulp.js](http://gulpjs.com/) task to test CKEditor 5 packages (used e.g. in https://github.com/ckeditor/ckeditor5) can look like this:

```js
gulp.task( 'test', () => {
	return require( '@ckeditor/ckeditor5-dev-tests' )
		.runAutomatedTests( getTestOptions() );
} );

gulp.task( 'test:manual', () => {
	return require( '@ckeditor/ckeditor5-dev-tests' )
		.runManualTests( getTestOptions() );
} );

function getTestOptions() {
	return require( '@ckeditor/ckeditor5-dev-tests' )
		.parseArguments( process.argv.slice( 2 ) );
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
* `files` - Specify file(s) to tests.
* `browsers` - Browsers which will be used to run the tests.
* `reporter` - Mocha reporter – either `karma` (default) or `dots` (less verbose one).

#### Examples

Test the `ckeditor5-enter` and `ckeditor5-paragraph` packages and generate code coverage report:

```bash
$ gulp test -c --files=enter,paragraph
```

Run `tests/view/**/*.js` tests from `ckeditor5-engine` and rerun them once any file change (the watch mode):

```bash
$ gulp test -w --files=engine/view
```

Test specified files in `ckeditor5-basic-styles` on two browsers (Chrome and Firefox) you can use:

```bash
$ gulp test --browsers=Chrome,Firefox --files=basic-styles/boldengine.js,basic-styles/italicengine.js
```

Test all installed packages:

```bash
$ gulp test --files=*
```

Test all installed packages except one (or more):

```bash
$ gulp test --files='!(engine)'
$ gulp test --files='!(engine|ui)'
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

Licensed under the GPL, LGPL and MPL licenses, at your choice. For full details about the license, please check the `LICENSE.md` file.
