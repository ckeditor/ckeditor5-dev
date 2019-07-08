/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint node: true, strict: true */

'use strict';

const path = require( 'path' );
const createManualTestServer = require( '../utils/manual-tests/createserver' );
const compileManualTestScripts = require( '../utils/manual-tests/compilescripts' );
const compileManualTestHtmlFiles = require( '../utils/manual-tests/compilehtmlfiles' );
const copyAssets = require( '../utils/manual-tests/copyassets' );
const removeDir = require( '../utils/manual-tests/removedir' );
const transformFileOptionToTestGlob = require( '../utils/transformfileoptiontotestglob' );

/**
 * Main function that runs manual tests.
 *
 * @param {Object} options
 * @param {Array.<String>} options.files Glob patterns specifying which tests to run.
 * @param {String} options.themePath A path to the theme the PostCSS theme-importer plugin is supposed to load.
 * @param {String} [options.language] A language passed to `CKEditorWebpackPlugin`.
 * @param {String} [options.additionalLanguages] Additional languages passed to `CKEditorWebpackPlugin`.
 * @returns {Promise}
 */
module.exports = function runManualTests( options ) {
	const buildDir = path.join( process.cwd(), 'build', '.manual-tests' );
	const files = ( options.files && options.files.length ) ? options.files : [ '*' ];
	const patterns = files.map( file => transformFileOptionToTestGlob( file, true ) );
	const language = options.language || 'en';
	const additionalLanguages = options.additionalLanguages ? options.additionalLanguages.split( ',' ) : null;

	return Promise.resolve()
		.then( () => removeDir( buildDir ) )
		.then( () => Promise.all( [
			compileManualTestScripts( {
				buildDir,
				patterns,
				themePath: options.themePath || null,
				language,
				additionalLanguages
			} ),
			compileManualTestHtmlFiles( {
				buildDir,
				patterns,
				language,
				additionalLanguages
			} ),
			copyAssets( buildDir )
		] ) )
		.then( () => createManualTestServer( buildDir ) );
};
