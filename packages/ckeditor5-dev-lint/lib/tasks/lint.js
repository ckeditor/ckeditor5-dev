/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const gulp = require( 'gulp' );
const eslint = require( 'gulp-eslint' );
const getSourceFiles = require( '../utils/getsourcefiles' );

/**
 * Returns a stream containing eslint reporter.
 *
 * @param {Object} [config={}]
 * @param {Array.<String>} [config.ignoredFiles=[]] Files that will be ignored.
 * @returns {Stream}
 */
module.exports = function lint( config = {} ) {
	const src = getSourceFiles( {
		ignoredFiles: config.ignoredFiles || []
	} );

	return gulp.src( src )
		.pipe( eslint() )
		.pipe( eslint.format() )
		.pipe( eslint.failAfterError() );
};
