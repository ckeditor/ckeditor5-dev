CKEditor 5 linting tasks
========================

Gulp linting tasks for [CKEditor 5](https://ckeditor5.github.io).

More information about development tools packages can be found at the following URL: <https://github.com/ckeditor/ckeditor5-dev>.

## Usage

```
npm i --save-dev @ckeditor/ckeditor5-dev-lint
```

`gulpfile.js`:

```js
'use strict';

const gulp = require( 'gulp' );

const ckeditor5Lint = require( '@ckeditor/ckeditor5-dev-lint' )( {
	ROOT_DIR: '.',

	// Files ignored by jshint and jscs tasks.
	// Files from .gitignore will be added automatically during tasks execution.
	ignoredFiles: []
} );

gulp.task( 'lint', ckeditor5Lint.lint );
gulp.task( 'lint-staged', ckeditor5Lint.lintStaged );
gulp.task( 'pre-commit', [ 'lint-staged' ] );
```

## License

Licensed under the GPL, LGPL and MPL licenses, at your choice. For full details about the license, please check the `LICENSE.md` file.
