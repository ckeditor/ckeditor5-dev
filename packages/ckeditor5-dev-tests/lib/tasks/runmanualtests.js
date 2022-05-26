/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const { Server: SocketServer } = require( 'socket.io' );
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
 * @param {Boolean} [options.disableWatch=false] Whether to disable the watch mechanism. If set to true, changes in source files
 * will not trigger webpack.
 * @param {String} [options.language] A language passed to `CKEditorWebpackPlugin`.
 * @param {Array.<String>} [options.additionalLanguages] Additional languages passed to `CKEditorWebpackPlugin`.
 * @param {Number} [options.port] A port number used by the `createManualTestServer`.
 * @param {String} [options.identityFile] A file that provides secret keys used in the test scripts.
 * @param {Boolean} [options.silent=false] Whether to hide files that will be processed by the script.
 * @returns {Promise}
 */
module.exports = function runManualTests( options ) {
	const buildDir = path.join( process.cwd(), 'build', '.manual-tests' );
	const files = ( options.files && options.files.length ) ? options.files : [ '*' ];
	const patterns = files.map( file => transformFileOptionToTestGlob( file, true ) )
		.reduce( ( returnedPatterns, globPatterns ) => {
			returnedPatterns.push( ...globPatterns );

			return returnedPatterns;
		}, [] );
	const themePath = options.themePath || null;
	const language = options.language;
	const additionalLanguages = options.additionalLanguages;
	const silent = options.silent || false;
	const disableWatch = options.disableWatch || false;
	let socketServer;

	function onScriptsCompilation( status ) {
		if ( socketServer ) {
			socketServer.emit( 'scriptsCompilation', status );
		}
	}

	return Promise.resolve()
		.then( () => removeDir( buildDir, { silent } ) )
		.then( () => Promise.all( [
			compileManualTestScripts( {
				buildDir,
				patterns,
				themePath,
				language,
				additionalLanguages,
				debug: options.debug,
				identityFile: options.identityFile,
				onScriptsCompilation,
				disableWatch
			} ),
			compileManualTestHtmlFiles( {
				buildDir,
				patterns,
				language,
				additionalLanguages,
				silent,
				disableWatch
			} ),
			copyAssets( buildDir )
		] ) )
		.then( () => createManualTestServer( buildDir, options.port, httpServer => {
			socketServer = new SocketServer( httpServer );
		} ) );
};
