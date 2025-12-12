/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import path from 'path';
import { globSync } from 'glob';
import { Server as SocketServer } from 'socket.io';
import createManualTestServer from '../utils/manual-tests/createserver.js';
import compileManualTestScripts from '../utils/manual-tests/compilescripts.js';
import compileManualTestHtmlFiles from '../utils/manual-tests/compilehtmlfiles.js';
import copyAssets from '../utils/manual-tests/copyassets.js';
import removeDir from '../utils/manual-tests/removedir.js';
import transformFileOptionToTestGlob from '../utils/transformfileoptiontotestglob.js';

/**
 * Main function that runs manual tests.
 *
 * @param {object} options
 * @param {Array.<string>} options.files Glob patterns specifying which tests to run.
 * @param {string} options.themePath A path to the theme the PostCSS theme-importer plugin is supposed to load.
 * @param {boolean} [options.disableWatch=false] Whether to disable the watch mechanism. If set to true, changes in source files
 * will not trigger webpack.
 * @param {string} [options.language] A language passed to `CKEditorTranslationsPlugin`.
 * @param {Array.<string>} [options.additionalLanguages] Additional languages passed to `CKEditorTranslationsPlugin`.
 * @param {number} [options.port] A port number used by the `createManualTestServer`.
 * @param {string} [options.identityFile] A file that provides secret keys used in the test scripts.
 * @param {string} [options.tsconfig] Path the TypeScript configuration file.
 * @param {boolean} [options.silent=false] Whether to hide files that will be processed by the script.
 * @returns {Promise}
 */
export default function runManualTests( options ) {
	const cwd = process.cwd();
	const buildDir = path.join( cwd, 'build', '.manual-tests' );
	const isFilesFlagProvided = ( options.files && options.files.length );
	const files = isFilesFlagProvided ? options.files : [ '*', 'ckeditor5' ];
	const dedupedFileTestGlobs = [ ...new Set( files.flatMap( file => transformFileOptionToTestGlob( file, true ) ) ) ];
	const sourceFiles = dedupedFileTestGlobs
		.reduce( ( result, manualTestPattern ) => {
			return [
				...result,
				...globSync( manualTestPattern )
					// Accept only files saved in the `/manual/` directory.
					.filter( manualTestFile => manualTestFile.match( /[\\/]manual[\\/]/ ) )
					// But do not parse manual tests utils saved in the `/manual/_utils/` directory.
					.filter( manualTestFile => !manualTestFile.match( /[\\/]manual[\\/]_utils[\\/]/ ) )
			];
		}, [] );

	const themePath = options.themePath || null;
	const language = options.language;
	const additionalLanguages = options.additionalLanguages;
	const silent = options.silent || false;
	const disableWatch = options.disableWatch || !isFilesFlagProvided;
	let socketServer;

	return Promise.resolve()
		.then( () => removeDir( buildDir, { silent } ) )
		.then( () => Promise.all( [
			compileManualTestScripts( {
				cwd,
				buildDir,
				sourceFiles,
				themePath,
				language,
				additionalLanguages,
				debug: options.debug,
				tsconfig: options.tsconfig,
				identityFile: options.identityFile,
				onTestCompilationStatus,
				disableWatch
			} ),
			compileManualTestHtmlFiles( {
				buildDir,
				sourceFiles,
				language,
				additionalLanguages,
				silent,
				onTestCompilationStatus,
				disableWatch
			} ),
			copyAssets( buildDir )
		] ) )
		.then( () => createManualTestServer( buildDir, options.port, httpServer => {
			socketServer = new SocketServer( httpServer );
		} ) );

	function onTestCompilationStatus( status ) {
		if ( socketServer ) {
			socketServer.emit( 'testCompilationStatus', status );
		}
	}
}
