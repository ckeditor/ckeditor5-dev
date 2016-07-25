CKEditor 5 Linting Tasks
========================================

[![devDependency Status](https://david-dm.org/ckeditor/ckeditor5-dev-lint/dev-status.svg)](https://david-dm.org/ckeditor/ckeditor5-dev-lint#info=devDependencies)
[![Dependency Status](https://david-dm.org/ckeditor/ckeditor5-dev-lint/status.svg)](https://david-dm.org/ckeditor/ckeditor5-dev-lint#info=dependencies)
[![npm version](https://badge.fury.io/js/ckeditor5-dev-lint.svg)](https://badge.fury.io/js/ckeditor5-dev-lint)

Gulp linting tasks for CKEditor 5. More information about the project can be found at the following URL: <https://github.com/ckeditor/ckeditor5-dev-lint>.

## Testing

Tests:

```
npm test
```

Code coverage:

```
npm coverage
```

## Usage

```js
/* jshint browser: false, node: true, strict: true */

'use strict';

const gulp = require( 'gulp' );

const ckeditor5Lint = require( 'ckeditor5-dev-lint' )( {
	ROOT_DIR: '.',

	// Files ignored by jshint and jscs tasks.
	// Files from .gitignore will be added automatically during tasks execution.
	IGNORED_FILES: []
} );

gulp.task( 'lint', ckeditor5Lint.lint );
gulp.task( 'lint-staged', ckeditor5Lint.lintStaged );
gulp.task( 'pre-commit', [ 'lint-staged' ] );
```

## License

Licensed under the GPL, LGPL and MPL licenses, at your choice. For full details about the license, please check the `LICENSE.md` file.
