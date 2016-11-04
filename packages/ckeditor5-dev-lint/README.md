CKEditor 5 Linting Tasks
========================================

[![npm version](https://badge.fury.io/js/%40ckeditor%2Fckeditor5-dev-lint.svg)](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-lint)
[![Build Status](https://travis-ci.org/ckeditor/ckeditor5-dev-lint.svg)](https://travis-ci.org/ckeditor/ckeditor5-dev-lint)
[![Test Coverage](https://codeclimate.com/github/ckeditor/ckeditor5-dev-lint/badges/coverage.svg)](https://codeclimate.com/github/ckeditor/ckeditor5-dev-lint/coverage)
[![Code Climate](https://codeclimate.com/github/ckeditor/ckeditor5-dev-lint/badges/gpa.svg)](https://codeclimate.com/github/ckeditor/ckeditor5-dev-lint)
[![Dependency Status](https://david-dm.org/ckeditor/ckeditor5-dev-lint/status.svg)](https://david-dm.org/ckeditor/ckeditor5-dev-lint#info=dependencies)
[![devDependency Status](https://david-dm.org/ckeditor/ckeditor5-dev-lint/dev-status.svg)](https://david-dm.org/ckeditor/ckeditor5-dev-lint#info=devDependencies)


Gulp linting tasks for [CKEditor 5](https://ckeditor5.github.io). More information about the project can be found at the following URL: <https://github.com/ckeditor/ckeditor5-dev-lint>.

## Testing

Tests:

```
npm test
```

Code coverage:

```
npm run coverage
```

## Usage

```
npm i --save-dev @ckeditor/ckeditor5-dev-lint
```

`gulpfile.js`:

```js
/* jshint browser: false, node: true, strict: true */

'use strict';

const gulp = require( 'gulp' );

const ckeditor5Lint = require( '@ckeditor/ckeditor5-dev-lint' )( {
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
