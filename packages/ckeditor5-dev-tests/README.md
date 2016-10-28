CKEditor 5 Tests
===================

[![devDependency Status](https://david-dm.org/ckeditor/ckeditor5-dev-tests/dev-status.svg)](https://david-dm.org/ckeditor/ckeditor5-dev-tests#info=devDependencies)
[![Dependency Status](https://david-dm.org/ckeditor/ckeditor5-dev-tests/status.svg)](https://david-dm.org/ckeditor/ckeditor5-dev-tests#info=dependencies)
[![npm version](https://badge.fury.io/js/%40ckeditor%2Fckeditor5-dev-tests.svg)](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)

Tasks used to test [CKEditor 5](https://ckeditor5.github.io) using Karma and Webpack. More information about the project can be found at the following URL: <https://github.com/ckeditor/ckeditor5-dev-tests>.

## Usage

```
npm i --save-dev @ckeditor/ckeditor5-dev-tests
```

We recommend to use Gulp for running the tests:

`gulpfile.js`

```js
const ckeditor5DevTests = require( '@ckeditor/ckeditor5-dev-tests' );

gulp.task( 'test', () => {
	const options = ckeditor5DevTests.utils.parseArguments();

	// Specify paths to tests. Must be relative to "tests" directory inside `options.rootPath`.
	options.paths = [
		// Returns a package name (from package.json) based on the current working directory. 
		// Useful when running package tests from that package.
		ckeditor5DevTests.utils.getPackageName()
	];

	// Returns an instance of Promise.
	return ckeditor5DevTests.tests.test( options );
} );
```

#### CLI options

* `watch` - Whether to watch the files and executing tests whenever any file changes. Also available as an alias: `-w`.
* `sourceMap` - Whether to generate the source maps. Also available as an alias: `-s`. 
* `coverage` - Whether to generate code coverage. Also available as an alias: `-c`.
* `verbose` - Whether to informs about Webpack's work. Also available as an alias: `-v`.
* `paths` - Specify path(s) to tests.
* `browsers` - Browsers which will be used to run the tests.
* `rootPath` - A path where compiled files will be saved. Should be relative to root of the package. By default it is `./.build/`.

#### Examples

For testing the `ckeditor5-enter` and `ckeditor5-paragraph` packages and generating the code coverage report you can use:

```bash
$ gulp test -c --paths=enter,paragraph
```

For testing *view* module from `ckeditor5-engine` and run the test automatically after changes in compiled code you can use:

```bash
$ gulp test -v --paths=engine/view
```

For testing specified files in `ckeditor5-basic-styles` on two browsers (Chrome and Firefox) you can use:

```bash
$ gulp test --browsers=Chrome,Firefox --paths=basic-styles/boldengine.js,basic-styles/italicengine.js
```

## License 

Licensed under the GPL, LGPL and MPL licenses, at your choice. For full details about the license, please check the `LICENSE.md` file.
