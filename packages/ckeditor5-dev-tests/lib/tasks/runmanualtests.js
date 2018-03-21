/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint node: true, strict: true */

'use strict';

const path = require( 'path' );
const createManualTestServer = require( '../utils/manual-tests/createserver' );
const compileManualTestScripts = require( '../utils/manual-tests/compilescripts' );
const compileManualTestHtmlFiles = require( '../utils/manual-tests/compilehtmlfiles' );
const removeDir = require( '../utils/manual-tests/removedir' );
const transformFileOptionToTestGlob = require( '../utils/transformfileoptiontotestglob' );

/**
 * Main function that runs manual tests.
 *
 * @param {Object} options
 * @param {Array.<String>} options.files
 * @returns {Promise}
 */
module.exports = function runManualTests( options ) {
	const buildDir = path.join( process.cwd(), 'build', '.manual-tests' );
	const files = normalizeFiles( options.files );
	const manualTestFilesPattern = files.map( file => transformFileOptionToTestGlob( file, true ) );

	return Promise.resolve()
		.then( () => removeDir( buildDir ) )
		.then( () => Promise.all( [
			compileManualTestScripts( buildDir, manualTestFilesPattern, options.themePath ),
			compileManualTestHtmlFiles( buildDir, manualTestFilesPattern )
		] ) )
		.then( () => createManualTestServer( buildDir ) );
};

function normalizeFiles( files ) {
	if ( !files || !files.length ) {
		return [ '*' ];
	}

	// '/' means tests from current package will be compiled. The main repository
	// does not contain any test so it doesn't make sense to have '/' here.
	// Using '*' allows compiling all packages tests'.
	if ( files.length === 1 && files[ 0 ] === '/' ) {
		return [ '*' ];
	}

	return files;
}
