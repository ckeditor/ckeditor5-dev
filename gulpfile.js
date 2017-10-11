/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const gulp = require( 'gulp' );

gulp.task( 'changelog', () => {
	return require( '@ckeditor/ckeditor5-dev-env' ).generateChangelogForSubPackages( {
		cwd: process.cwd(),
		packages: 'packages'
	} );
} );
