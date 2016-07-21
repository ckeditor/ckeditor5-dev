/* jshint browser: false, node: true, strict: true */

'use strict';

const gulp = require( 'gulp' );
const ckeditor5Lint = require( './lib/lint' )( {
	ROOT_DIR: '.',

	// Files ignored by jshint and jscs tasks. Files from .gitignore will be added automatically during tasks execution.
	IGNORED_FILES: []
} );
const ckeditor5Test = require( './tests/' )();

gulp.task( 'test', ckeditor5Test.test );
gulp.task( 'test:pre-coverage', ckeditor5Test.prepareCoverage );
gulp.task( 'test:coverage', [ 'test:pre-coverage' ], ckeditor5Test.test );
gulp.task( 'lint', ckeditor5Lint.lint );
gulp.task( 'lint-staged', ckeditor5Lint.lintStaged );
gulp.task( 'pre-commit', [ 'lint-staged' ] );
