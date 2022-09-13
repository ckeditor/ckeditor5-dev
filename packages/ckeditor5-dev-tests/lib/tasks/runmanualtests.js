/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const chalk = require( 'chalk' );
const { spawn } = require( 'child_process' );
const inquirer = require( 'inquirer' );
const isInteractive = require( 'is-interactive' );
const { Server: SocketServer } = require( 'socket.io' );
const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );
const createManualTestServer = require( '../utils/manual-tests/createserver' );
const compileManualTestScripts = require( '../utils/manual-tests/compilescripts' );
const compileManualTestHtmlFiles = require( '../utils/manual-tests/compilehtmlfiles' );
const copyAssets = require( '../utils/manual-tests/copyassets' );
const removeDir = require( '../utils/manual-tests/removedir' );
const globSync = require( '../utils/glob' );
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
	const sourceFiles = files
		.flatMap( file => transformFileOptionToTestGlob( file, true ) )
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
	const disableWatch = options.disableWatch || false;
	let socketServer;

	function onTestCompilationStatus( status ) {
		if ( socketServer ) {
			socketServer.emit( 'testCompilationStatus', status );
		}
	}

	/**
	 * Checks if building DLLs is needed, i.e. if all of the following conditions are met:
	 *  * At least one filename of the requested manual tests ends with the `-dll` suffix.
	 *  * The terminal, in which the manual tests are started, is interactive.
	 *  * User confirmed building the DLLs.
	 *
	 * @param {Array.<String>} sourceFiles
	 * @returns {Promise}
	 */
	function isDllBuildRequired( sourceFiles ) {
		const hasDllManualTest = sourceFiles.some( filePath => filePath.endsWith( '-dll.js' ) );

		if ( !hasDllManualTest ) {
			return Promise.resolve( false );
		}
		if ( !isInteractive() ) {
			// For non-interactive environments, like CI, return the default answer.
			return Promise.resolve( false );
		}

		const confirmQuestion = {
			message: 'Some tests require DLLs to be built. Build them now?',
			type: 'confirm',
			name: 'confirm',
			default: false
		};

		return inquirer.prompt( [ confirmQuestion ] )
			.then( answers => answers.confirm );
	}

	/**
	 * Checks the `package.json` in each repository whether it has a script for building the DLLs and calls it if so.
	 * It builds DLLs sequentially, one after the other.
	 *
	 * @returns {Promise}
	 */
	async function buildDll() {
		// A braced section in the `glob` syntax starts with { and ends with } and they are expanded into a set of patterns.
		// A braced section may contain any number of comma-delimited sections (path fragments) within.
		//
		// The following braced section finds all `package.json` in all repositories in one `glob` call and it returns absolute paths to
		// them for the CKEditor 5 repository and all external repositories.
		const pkgJsonPaths = globSync( '{,external/*/}package.json' )
			.map( relativePath => path.resolve( relativePath ) );

		for ( const pkgJsonPath of pkgJsonPaths ) {
			const pkgJson = JSON.parse( fs.readFileSync( pkgJsonPath, 'utf-8' ) );

			if ( pkgJson.scripts && pkgJson.scripts[ 'dll:build' ] ) {
				await buildDllInRepository( path.dirname( pkgJsonPath ) );
			}
		}
	}

	/**
	 * Executes the script for building DLLs in the specified repository.
	 *
	 * @param {String} repositoryPath
	 * @returns {Promise}
	 */
	function buildDllInRepository( repositoryPath ) {
		const repositoryName = path.basename( repositoryPath );
		const spinnerTitle = `Building DLLs in ${ chalk.bold( repositoryName ) }... ${ chalk.gray( '(It may take a while)' ) }`;
		const spinner = tools.createSpinner( spinnerTitle );

		return new Promise( ( resolve, reject ) => {
			const spawnOptions = {
				encoding: 'utf8',
				shell: true,
				cwd: repositoryPath,
				stderr: 'inherit'
			};

			spawn( 'yarnpkg', [ 'run', 'dll:build' ], spawnOptions )
				.on( 'spawn', () => {
					spinner.start();
				} )
				.on( 'close', exitCode => {
					spinner.finish();

					if ( exitCode ) {
						return reject( new Error( `Building DLLs in ${ repositoryName } finished with an error.` ) );
					}

					return resolve();
				} );
		} );
	}

	return Promise.resolve()
		.then( () => isDllBuildRequired( sourceFiles ) )
		.then( shouldBuildDll => {
			if ( shouldBuildDll ) {
				return buildDll();
			}
		} )
		.then( () => removeDir( buildDir, { silent } ) )
		.then( () => Promise.all( [
			compileManualTestScripts( {
				buildDir,
				sourceFiles,
				themePath,
				language,
				additionalLanguages,
				debug: options.debug,
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
};
