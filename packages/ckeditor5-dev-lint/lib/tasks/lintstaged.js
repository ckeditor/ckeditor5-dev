/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const gulp = require( 'gulp' );
const eslint = require( 'gulp-eslint' );
const filter = require( 'gulp-filter' );
const getSourceFiles = require( '../utils/getsourcefiles' );

/**
 * This function is executed on pre-commit hook, linting only files staged for the current commit.
 *
 * @param {Object} [config={}]
 * @param {Array.<String>} [config.ignoredFiles=[]] Files that will be ignored.
 * @returns {Stream}
 */
module.exports = function lintStaged( config = {} ) {
	const src = getSourceFiles( {
		ignoredFiles: config.ignoredFiles || []
	} );

	const guppy = require( 'git-guppy' )( gulp );

	return guppy.stream( 'pre-commit', { base: './' } )
		.pipe( filter( src ) )
		.pipe( eslint() )
		.pipe( eslint.format() )
		.pipe( eslint.failAfterError() );
};
