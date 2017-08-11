CKEditor 5 linting tasks
========================

Gulp linting tasks for [CKEditor 5](https://ckeditor5.github.io).

More information about development tools packages can be found at the following URL: <https://github.com/ckeditor/ckeditor5-dev>.

## Usage

```
npm i --save-dev @ckeditor/ckeditor5-dev-lint guppy-pre-commit
```

`gulpfile.js`:

```js
'use strict';

const gulp = require( 'gulp' );

const ckeditor5Lint = require( '@ckeditor/ckeditor5-dev-lint' )();

gulp.task( 'lint', ckeditor5Lint.lint );
gulp.task( 'lint-staged', ckeditor5Lint.lintStaged );
gulp.task( 'pre-commit', [ 'lint-staged' ] );
```

The lint task will skip the files listed in `.gitignore`. You can also pass `option.ignoredFiles`:

```js
const ckeditor5Lint = require( '@ckeditor/ckeditor5-dev-lint' )( {
	// Files ignored by `gulp lint` task.
	// Files from .gitignore will be added automatically during task execution.
	ignoredFiles: [
		'src/lib/**'
	]
} );
```

## Changelog

The changes are described in the [`CHANGELOG.md`](https://github.com/ckeditor/ckeditor5-dev/blob/master/packages/ckeditor5-dev-lint/CHANGELOG.md) file.

## License

Licensed under the GPL, LGPL and MPL licenses, at your choice. For full details about the license, please check the `LICENSE.md` file.
