/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint node: true, strict: true */

'use strict';

const path = require( 'path' );
const createManualTestServer = require( '../utils/manual-tests/createmanualtestserver' );
const compileManualTestScripts = require( '../utils/manual-tests/compilemanualtestscripts' );
const compileManualTestHtmlFiles = require( '../utils/manual-tests/compilemanualtesthtmlfiles' );

/**
 * Main function that runs automated tests.
 *
 * @returns {Promise}
 */
module.exports = function runManualTests() {
	const buildDir = path.join( process.cwd(), 'build', '.manual-tests' );
	const manualTestPattern = path.join( process.cwd(), 'node_modules', 'ckeditor5-*', 'tests', '**', 'manual', '**' );

	return Promise.all( [
		compileManualTestScripts( buildDir, manualTestPattern ),
		compileManualTestHtmlFiles( buildDir, manualTestPattern )
	] )
	.then( () => createManualTestServer( buildDir ) );
};
