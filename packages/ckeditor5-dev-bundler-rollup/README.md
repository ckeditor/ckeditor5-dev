CKEditor 5 Rollup bundler task
==============================

Gulp task which can be used to build a [CKEditor 5](https://ckeditor5.github.io) bundle using [Rollup](http://rollupjs.org/).

More information about development tools packages can be found at the following URL: <https://github.com/ckeditor/ckeditor5-dev>.

## Usage

```
npm i --save-dev @ckeditor/ckeditor5-dev-bundler-rollup
```

To include development tasks in your `gulpfile.js`:

```js
const gulp = require( 'gulp' );

gulp.task( 'build', () => {
	const bundler = require( '@ckeditor/ckeditor5-dev-bundler-rollup' );

	return bundler.tasks.build( getBuildOptions() );
} );

function getBuildOptions() {
	const minimist = require( 'minimist' );
	const pathToConfig = minimist( process.argv.slice( 2 ) ).config || './build-config';

	return {
		packages: getCKEditor5PackagesPaths(),
		buildConfig: require( path.resolve( '.', pathToConfig ) ),
	};
}

function getCKEditor5PackagesPaths() {
	const compiler = require( '@ckeditor/ckeditor5-dev-compiler' );
	return compiler.utils.getPackages( '.' );
}

```

Build config options:

* `destinationPath` - Path where the editor files will be saved.
* `rollupOptions` - [Rollup options](https://github.com/rollup/rollup/wiki/JavaScript-API).
* `[entryPoint]` - Path to the [entry point](https://github.com/rollup/rollup/wiki/JavaScript-API#entry).
* `[editor]` - Path to the editor theme.
* `[plugins]` - List of the CKEditor plugins.

If the entry point is provided, then editor and plugins options are ignored.

Minimum Rollup options:

* `moduleName` - Name of CKEditor instance exposed as global variable by a bundle.
* `format` - The format of the generated bundle (`iife` is default).

Sample build config:

```js
'use strict';

module.exports = {
	destinationPath: './build/dist/',
	editor: 'editor-classic/classic'
	plugins: [
		'autoformat',
		'basic-styles/bold',
		'basic-styles/italic',
		'clipboard',
		'enter',
		'heading',
		'image',
		'link',
		'list',
		'paragraph',
		'typing',
		'undo'
	],
	rollupOptions: {
		moduleName: 'ClassicEditor',
		format: 'iife',
	}
};
```

## Changelog

See the [`CHANGELOG.md`](https://github.com/ckeditor/ckeditor5-dev/blob/master/packages/ckeditor5-dev-bundler-rollup/CHANGELOG.md) file.

## License

Licensed under the GPL, LGPL and MPL licenses, at your choice. For full details about the license, please check the `LICENSE.md` file.
