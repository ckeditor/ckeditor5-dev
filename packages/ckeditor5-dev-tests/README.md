CKEditor 5 Tests
===================

[![devDependency Status](https://david-dm.org/ckeditor/ckeditor5-dev-tests/dev-status.svg)](https://david-dm.org/ckeditor/ckeditor5-dev-tests#info=devDependencies)
[![Dependency Status](https://david-dm.org/ckeditor/ckeditor5-dev-tests/status.svg)](https://david-dm.org/ckeditor/ckeditor5-dev-tests#info=dependencies)
[![npm version](https://badge.fury.io/js/%40ckeditor%2Fckeditor5-dev-tests.svg)](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)

Testing environment for [CKEditor 5](https://ckeditor5.github.io). It's based on [Karma](https://karma-runner.github.io/) and [Webpack](https://webpack.github.io/). More information about the project can be found at the following URL: <https://github.com/ckeditor/ckeditor5-dev-tests>.

## Usage

```
npm i --save-dev @ckeditor/ckeditor5-dev-tests
```

A [gulp.js](http://gulpjs.com/) task to test CKEditor 5 packages (used e.g. in https://github.com/ckeditor/ckeditor5):

```js
gulp.task( 'test', () => {
	const tests = require( '@ckeditor/ckeditor5-dev-tests' );
	const compiler = require( '@ckeditor/ckeditor5-dev-compiler' );
	const options = tests.utils.parseArguments();

	options.packages = compiler.utils.getPackages( '.' )

	// If --paths weren't specified, then test all packages.
	if ( !options.paths ) {
		options.paths = options.packages
			.map( ( packagePath ) => tests.utils.getPackageName( path.resolve( packagePath ) ) );
	}

	return tests.tasks.test( options );
} );
```

#### CLI options

* `watch` - Whether to watch the files and executing tests whenever any file changes. Also available as an alias: `-w`.
* `source-map` - Whether to generate the source maps. Also available as an alias: `-s`.
* `coverage` - Whether to generate code coverage. Also available as an alias: `-c`.
* `verbose` - Whether to informs about Webpack's work. Also available as an alias: `-v`.
* `paths` - Specify path(s) to tests.
* `browsers` - Browsers which will be used to run the tests.

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
