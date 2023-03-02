/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
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
const { logger } = require( '@ckeditor/ckeditor5-dev-utils' );
const createManualTestServer = require( '../utils/manual-tests/createserver' );
const compileManualTestScripts = require( '../utils/manual-tests/compilescripts' );
const compileManualTestHtmlFiles = require( '../utils/manual-tests/compilehtmlfiles' );
const copyAssets = require( '../utils/manual-tests/copyassets' );
const removeDir = require( '../utils/manual-tests/removedir' );
const globSync = require( '../utils/glob' );
const transformFileOptionToTestGlob = require( '../utils/transformfileoptiontotestglob' );
const requireDll = require( '../utils/requiredll' );

/**
 * Main function that runs manual tests.
 *
 * @param {Object} options
 * @param {Array.<String>} options.files Glob patterns specifying which tests to run.
 * @param {String} options.themePath A path to the theme the PostCSS theme-importer plugin is supposed to load.
 * @param {Boolean} [options.disableWatch=false] Whether to disable the watch mechanism. If set to true, changes in source files
 * will not trigger webpack.
 * @param {String} [options.language] A language passed to `CKEditorTranslationsPlugin`.
 * @param {Array.<String>} [options.additionalLanguages] Additional languages passed to `CKEditorTranslationsPlugin`.
 * @param {Number} [options.port] A port number used by the `createManualTestServer`.
 * @param {String} [options.identityFile] A file that provides secret keys used in the test scripts.
 * @param {String} [options.tsconfig] Path the TypeScript configuration file.
 * @param {Boolean|null} [options.dll=null] If `null`, user is asked to create DLL builds, if they are required by test files.
 * If `true`, DLL builds are created automatically, if required by test files. User is not asked.
 * If `false`, DLL builds are not created. User is not asked.
 * @param {Boolean} [options.silent=false] Whether to hide files that will be processed by the script.
 * @returns {Promise}
 */
module.exports = function runManualTests( options ) {
	const log = logger();
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
		.then( () => isDllBuildRequired( sourceFiles ) )
		.then( shouldBuildDll => {
			if ( shouldBuildDll ) {
				return buildDll();
			}
		} )
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

	/**
	 * Checks if building the DLLs is needed.
	 *
	 * @param {Array.<String>} sourceFiles
	 * @returns {Promise}
	 */
	function isDllBuildRequired( sourceFiles ) {
		const hasDllManualTest = requireDll( sourceFiles );

		// Skip building DLLs if there are no DLL-related manual tests.
		if ( !hasDllManualTest ) {
			return Promise.resolve( false );
		}

		// If flag for auto-building the DLLs without user interaction is set, take it into account.
		if ( options.dll !== null ) {
			return Promise.resolve( options.dll );
		}

		// Otherwise, for non-interactive environments like CI, do not build the DLLs.
		if ( !isInteractive() ) {
			return Promise.resolve( false );
		}

		// Finally, ask the user.
		const confirmQuestion = {
			message: 'Create the DLL builds now?',
			type: 'confirm',
			name: 'confirm',
			default: false
		};

		log.warning( chalk.bold( '\n⚠ Some tests require DLL builds.\n' ) );
		log.info( 'You don\'t have to update these builds every time unless you want to check changes in DLL tests.' );
		log.info(
			'You can use the following flags to skip this prompt in the future: ' +
			`${ chalk.bold( '--dll' ) } / ${ chalk.bold( '--no-dll' ) }.\n`
		);

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
			.map( relativePath => path.resolve( relativePath ) )
			.sort( absolutePath => {
				// The CKEditor 5 repository must be built first, before the other external repositories.
				if ( !/[\\/]external[\\/]/.test( absolutePath ) ) {
					return -1;
				}

				// The build order of external repositories does not matter.
				return 0;
			} );

		for ( const pkgJsonPath of pkgJsonPaths ) {
			const pkgJson = JSON.parse( fs.readFileSync( pkgJsonPath, 'utf-8' ) );

			if ( pkgJson.scripts && pkgJson.scripts[ 'dll:build' ] ) {
				await buildDllInRepository( path.dirname( pkgJsonPath ) );
			}
		}

		console.log( '\n📍 DLL building complete.\n' );
	}

	/**
	 * Executes the script for building DLLs in the specified repository.
	 *
	 * @param {String} repositoryPath
	 * @returns {Promise}
	 */
	function buildDllInRepository( repositoryPath ) {
		const repositoryName = path.basename( repositoryPath );

		log.info( `\n📍 Building DLLs in ${ chalk.bold( repositoryName ) }...\n` );

		return new Promise( ( resolve, reject ) => {
			const spawnOptions = {
				encoding: 'utf8',
				shell: true,
				cwd: repositoryPath,
				stdio: 'inherit'
			};

			spawn( 'yarnpkg', [ 'run', 'dll:build' ], spawnOptions )
				.on( 'close', exitCode => {
					if ( exitCode ) {
						return reject( new Error( `Building DLLs in ${ repositoryName } finished with an error.` ) );
					}

					return resolve();
				} );
		} );
	}
};
