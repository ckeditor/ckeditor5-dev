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
	const tests = require( '@ckeditor/ckeditor5-dev-tests' );
	const compiler = require( '@ckeditor/ckeditor5-dev-compiler' );
	const options = tests.utils.parseArguments();

	options.packages = compiler.utils.getPackages( '.' )

	// If --files weren't specified, then test all packages.
	if ( !options.files ) {
		options.files = options.packages
			.map( ( packagePath ) => tests.utils.getPackageName( path.resolve( packagePath ) ) );
	}

	return tests.tasks.automated.test( options );
} );
```

You can also use the bin script for testing a package:

```bash
# For running all the tests (for the current package and all dependencies).
./node_modules/.bin/ckeditor5-dev-tests --files=**/*.js

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

For testing the `ckeditor5-enter` and `ckeditor5-paragraph` packages and generating the code coverage report you can use:

```bash
$ gulp test -c --files=enter,paragraph
```

For testing *view* module from `ckeditor5-engine` and run the test automatically after changes in compiled code you can use:

```bash
$ gulp test -w --files=engine/view
```

For testing specified files in `ckeditor5-basic-styles` on two browsers (Chrome and Firefox) you can use:

```bash
$ gulp test --browsers=Chrome,Firefox --files=basic-styles/boldengine.js,basic-styles/italicengine.js
```

## License

Licensed under the GPL, LGPL and MPL licenses, at your choice. For full details about the license, please check the `LICENSE.md` file.
