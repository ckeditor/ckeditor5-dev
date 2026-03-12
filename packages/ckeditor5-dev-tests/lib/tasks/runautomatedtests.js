/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { styleText } from 'node:util';
import { logger } from '@ckeditor/ckeditor5-dev-utils';
import getKarmaConfig from '../utils/automated-tests/getkarmaconfig.js';
import { globSync } from 'glob';
import { minimatch } from 'minimatch';
import { mkdirp } from 'mkdirp';
import karmaLogger from 'karma/lib/logger.js';
import karma from 'karma';
import transformFileOptionToTestGlob from '../utils/transformfileoptiontotestglob.js';
import upath from 'upath';

// Glob patterns that should be ignored. It means if a specified test file is located under path
// that matches to these patterns, the file will be skipped.
const IGNORE_GLOBS = [
	// Ignore files which are saved in `manual/` directory. There are manual tests.
	upath.join( '**', 'tests', '**', 'manual', '**', '*.{js,ts}' ),
	// Ignore `_utils` directory as well because there are saved utils for tests.
	upath.join( '**', 'tests', '**', '_utils', '**', '*.{js,ts}' )
];

const AUTOMATED_TESTS_BUILD_PATH = upath.join( process.cwd(), 'build', '.automated-tests' );

// An absolute path to the entry file that will be passed to Karma.
const KARMA_ENTRY_FILE_PATH = upath.join( AUTOMATED_TESTS_BUILD_PATH, 'entry-point.js' );

export default function runAutomatedTests( options ) {
	return Promise.resolve().then( () => {
		if ( !options.production ) {
			console.warn( styleText(
				'yellow',
				'⚠ You\'re running tests in dev mode - some error protections are loose. Use the `--production` flag ' +
				'to use strictest verification methods.'
			) );
		}

		const globPatterns = transformFilesToTestGlob( options.files );
		const allFiles = collectFilesToTests( globPatterns );
		const packageRoots = [ ...new Set( allFiles.map( getPackageRootFromTestFile ) ) ];
		const packageInfoByRoot = getPackageInfoByRoot( packageRoots );
		const vitestPackageRoots = getVitestPackageRoots( packageInfoByRoot );
		const { karmaFiles, vitestFiles } = splitFilesByTestRunner( allFiles, vitestPackageRoots );

		if ( !karmaFiles.length && !vitestFiles.length ) {
			throw new Error( 'Not found files to tests. Specified patterns are invalid.' );
		}

		if ( karmaFiles.length && vitestFiles.length && options.coverage ) {
			throw new Error(
				'Coverage cannot be collected in a mixed Karma + Vitest run. ' +
				'Run coverage separately for Karma and Vitest packages.'
			);
		}

		if ( karmaFiles.length && vitestFiles.length && options.watch ) {
			throw new Error(
				'Watch mode cannot be used in a mixed Karma + Vitest run. ' +
				'Run watch mode separately for Karma and Vitest packages.'
			);
		}

		const errors = [];
		let runnerSequence = Promise.resolve();

		if ( karmaFiles.length ) {
			runnerSequence = runnerSequence
				.then( () => prepareAndRunKarma( options, karmaFiles, globPatterns, vitestFiles.length > 0 ) )
				.catch( error => {
					errors.push( error );
				} );
		}

		if ( vitestFiles.length ) {
			const vitestExecutionPlan = getVitestExecutionPlan( vitestFiles, packageInfoByRoot );

			runnerSequence = runnerSequence
				.then( () => prepareAndRunVitest( options, vitestExecutionPlan ) )
				.catch( error => {
					errors.push( error );
				} );
		}

		return runnerSequence.then( () => {
			if ( errors.length ) {
				throw aggregateExecutionErrors( errors );
			}
		} );
	} );
}

function prepareAndRunKarma( options, karmaFiles, allGlobPatterns, hasMixedRunners ) {
	createKarmaEntryFile( [ ...karmaFiles ], options.production );

	const optionsForKarma = Object.assign( {}, options, {
		entryFile: KARMA_ENTRY_FILE_PATH,
		globPatterns: hasMixedRunners ? { karma: [ ...karmaFiles ] } : allGlobPatterns
	} );

	return runKarma( optionsForKarma );
}

function prepareAndRunVitest( options, vitestExecutionPlan ) {
	return runVitest( options, vitestExecutionPlan );
}

function transformFilesToTestGlob( files ) {
	if ( !Array.isArray( files ) || files.length === 0 ) {
		throw new Error( 'Karma requires files to tests. `options.files` has to be non-empty array.' );
	}

	const globMap = {};

	for ( const singleFile of files ) {
		globMap[ singleFile ] = transformFileOptionToTestGlob( singleFile );
	}

	return globMap;
}

function collectFilesToTests( globPatterns ) {
	karmaLogger.setupFromConfig( { logLevel: 'INFO' } );

	const log = karmaLogger.create( 'config' );
	const allFiles = [];

	for ( const singlePattern of Object.keys( globPatterns ) ) {
		let hasFiles = false;

		for ( const resolvedPattern of globPatterns[ singlePattern ] ) {
			const files = globSync( resolvedPattern ).map( filePath => upath.normalize( filePath ) );

			if ( files.length ) {
				hasFiles = true;
			}

			allFiles.push(
				...files.filter( file => !IGNORE_GLOBS.some( globPattern => minimatch( file, globPattern ) ) )
			);
		}

		if ( !hasFiles ) {
			log.warn( 'Pattern "%s" does not match any file.', singlePattern );
		}
	}

	return allFiles;
}

function splitFilesByTestRunner( allFiles, vitestPackageRoots ) {
	const karmaFiles = [];
	const vitestFiles = [];

	for ( const file of allFiles ) {
		const packageRoot = getPackageRootFromTestFile( file );

		if ( vitestPackageRoots.has( packageRoot ) ) {
			vitestFiles.push( file );
		} else {
			karmaFiles.push( file );
		}
	}

	return { karmaFiles, vitestFiles };
}

function getVitestPackageRoots( packageInfoByRoot ) {
	return new Set( [ ...packageInfoByRoot.values() ]
		.filter( packageInfo => packageInfo.runner === 'vitest' )
		.map( packageInfo => packageInfo.packageRoot ) );
}

function getPackageInfoByRoot( packageRoots ) {
	const packageInfoByRoot = new Map();

	for ( const packageRoot of packageRoots ) {
		const packageInfo = getPackageInfo( packageRoot );

		packageInfoByRoot.set( packageRoot, packageInfo );
	}

	return packageInfoByRoot;
}

function getPackageInfo( packageRoot ) {
	let packageJson = null;

	try {
		const packageJsonPath = upath.join( packageRoot, 'package.json' );
		packageJson = JSON.parse( fs.readFileSync( packageJsonPath, 'utf8' ) );
	} catch {
		packageJson = null;
	}

	const packageName = packageJson?.name || upath.basename( packageRoot );
	const projectName = upath.basename( packageRoot ).replace( /^ckeditor5-/, '' );
	const repositoryRoot = getRepositoryRootFromPackageRoot( packageRoot );

	return {
		packageRoot,
		packageName,
		projectName,
		repositoryRoot,
		runner: packageJson ? getTestRunnerForPackageJson( packageJson ) : 'karma'
	};
}

function getPackageRootFromTestFile( filePath ) {
	const normalizedPath = upath.normalize( filePath );
	const testsDirectoryIndex = normalizedPath.lastIndexOf( '/tests/' );

	if ( testsDirectoryIndex === -1 ) {
		throw new Error( `Cannot determine package root for "${ filePath }".` );
	}

	return normalizedPath.slice( 0, testsDirectoryIndex );
}

function getTestRunnerForPackageJson( packageJson ) {
	const testScript = packageJson?.scripts?.test;

	if ( typeof testScript === 'string' && /\bvitest\b/.test( testScript ) ) {
		return 'vitest';
	}

	return 'karma';
}

function getRepositoryRootFromPackageRoot( packageRoot ) {
	const normalizedPath = upath.normalize( packageRoot );
	const packagesDirectoryIndex = normalizedPath.lastIndexOf( '/packages/' );

	if ( packagesDirectoryIndex === -1 ) {
		throw new Error( `Cannot determine repository root for "${ packageRoot }".` );
	}

	return normalizedPath.slice( 0, packagesDirectoryIndex );
}

function createKarmaEntryFile( files, production ) {
	// Set global license key in the `before` hook.
	files.unshift( upath.join( import.meta.dirname, '..', 'utils', 'automated-tests', 'licensekeybefore.js' ) );

	// Inject the leak detector root hooks. Need to be split into two parts due to #598.
	files.splice( 0, 0, upath.join( import.meta.dirname, '..', 'utils', 'automated-tests', 'leaksdetectorbefore.js' ) );
	files.push( upath.join( import.meta.dirname, '..', 'utils', 'automated-tests', 'leaksdetectorafter.js' ) );

	const entryFileContent = files
		.map( file => 'import "' + file + '";' );

	// Inject the custom chai assertions. See ckeditor/ckeditor5#9668.
	const assertionsDir = upath.join( import.meta.dirname, '..', 'utils', 'automated-tests', 'assertions' );
	const customAssertions = fs.readdirSync( assertionsDir ).map( assertionFileName => {
		return [
			assertionFileName,
			upath.parse( assertionFileName ).name.replace( /-([a-z])/g, value => value[ 1 ].toUpperCase() )
		];
	} );

	// Two loops are needed to achieve correct order in `ckeditor5/build/.automated-tests/entry-point.js`.
	for ( const [ fileName, functionName ] of customAssertions ) {
		entryFileContent.push( `import ${ functionName }Factory from "${ assertionsDir }/${ fileName }";` );
	}
	for ( const [ , functionName ] of customAssertions ) {
		entryFileContent.push( `${ functionName }Factory( chai );` );
	}

	if ( production ) {
		entryFileContent.unshift( assertConsoleUsageToThrowErrors() );
	}

	mkdirp.sync( upath.dirname( KARMA_ENTRY_FILE_PATH ) );
	fs.writeFileSync( KARMA_ENTRY_FILE_PATH, entryFileContent.join( '\n' ) + '\n' );

	// Webpack watcher compiles the file in a loop. It causes to Karma that runs tests multiple times in watch mode.
	// A ugly hack blocks the loop and tests are executed once.
	// See: https://github.com/webpack/watchpack/issues/25.
	const now = Date.now() / 1000;
	// 10 sec is default value of FS_ACCURENCY (which is hardcoded in Webpack watcher).
	const then = now - 10;
	fs.utimesSync( KARMA_ENTRY_FILE_PATH, then, then );
}

function getVitestExecutionPlan( files, packageInfoByRoot ) {
	const repositoryPlans = new Map();

	for ( const file of files ) {
		const packageRoot = getPackageRootFromTestFile( file );
		const packageInfo = packageInfoByRoot.get( packageRoot );

		if ( !packageInfo ) {
			throw new Error( `Missing package metadata for "${ packageRoot }".` );
		}

		if ( !repositoryPlans.has( packageInfo.repositoryRoot ) ) {
			repositoryPlans.set( packageInfo.repositoryRoot, {
				repositoryRoot: packageInfo.repositoryRoot,
				projects: new Set()
			} );
		}

		const repositoryPlan = repositoryPlans.get( packageInfo.repositoryRoot );

		repositoryPlan.projects.add( packageInfo.projectName );
	}

	return [ ...repositoryPlans.values() ].map( repositoryPlan => ( {
		repositoryRoot: repositoryPlan.repositoryRoot,
		projects: [ ...repositoryPlan.projects ]
	} ) );
}

function aggregateExecutionErrors( errors ) {
	if ( errors.length === 1 ) {
		return errors[ 0 ];
	}

	const details = errors
		.map( error => `- ${ error.message }` )
		.join( '\n' );

	return new Error( `Test execution failed in multiple runners:\n${ details }` );
}

function assertConsoleUsageToThrowErrors() {
	const functionString = makeConsoleUsageToThrowErrors.toString();

	return functionString
		// Extract the body of the function from between the opening and closing braces.
		.substring(
			functionString.indexOf( '{' ) + 1,
			functionString.lastIndexOf( '}' )
		)
		// Remove the leading and trailing new lines.
		.trim()
		// Decrease indent for the extracted function body by one tab.
		.replace( /^\t/gm, '' );
}

function makeConsoleUsageToThrowErrors() {
	const originalWarn = console.warn;

	window.production = true;

	// Important: Do not remove the comment below. It is used to assert this function insertion in tests.
	//
	// Make using any method from the console to fail.
	before( () => {
		Object.keys( console )
			.filter( methodOrProperty => typeof console[ methodOrProperty ] === 'function' )
			.forEach( method => {
				console[ method ] = ( ...data ) => {
					originalWarn( 'Detected `console.' + method + '()`:', ...data );

					// Previously, the error was thrown at this point. Unfortunately, it may happen that some asynchronous piece of code
					// will call a console method after Mocha has finished the test. In that case:
					// * Mocha will not be able to catch such a thrown error, even though it has registered the "uncaughtException" and the
					//   "unhandledRejection" error handlers.
					// * Mocha will not be able to mark the test as failed.
					// * Karma will finish the whole test run, and in the console, you will see something like "Executed 42 of 191 SUCCESS".
					//
					// Probably the test that causes such problems is incorrectly written:
					// * The "done()" function is not called at the right moment, or the test does not return a promise.
					// * Not all dependencies used in the source code under test are mocked, and they cause side effects, i.e., asynchronous
					//   console method calls after the test is over.
					//
					// To ensure that the console methods usage still fail the whole test run, we are calling the error handler from Karma
					// to stop the Karma server.
					__karma__.error( 'Detected `console.' + method + '()`: ' + data[ 0 ] );
				};
			} );
	} );
}

function runKarma( options ) {
	return new Promise( ( resolve, reject ) => {
		const KarmaServer = karma.Server;
		const parseConfig = karma.config.parseConfig;

		const config = getKarmaConfig( options );
		const parsedConfig = parseConfig( null, config, { throwErrors: true } );

		const server = new KarmaServer( parsedConfig, exitCode => {
			if ( exitCode === 0 ) {
				resolve();
			} else {
				reject( new Error( `Karma finished with "${ exitCode }" code.` ) );
			}
		} );

		if ( options.coverage ) {
			const coveragePath = upath.join( process.cwd(), 'coverage' );

			server.on( 'run_complete', () => {
				// Use timeout to not write to the console in the middle of Karma's status.
				setTimeout( () => {
					const log = logger();

					log.info( `Coverage report saved in '${ styleText( 'cyan', coveragePath ) }'.` );
				} );
			} );
		}

		server.start();
	} );
}

function runVitest( options, vitestExecutionPlan ) {
	let sequence = Promise.resolve();

	for ( const repositoryPlan of vitestExecutionPlan ) {
		sequence = sequence.then( () => runVitestForRepository( options, repositoryPlan ) );
	}

	return sequence;
}

function runVitestForRepository( options, repositoryPlan ) {
	return new Promise( ( resolve, reject ) => {
		const args = [ 'vitest' ];

		if ( options.watch ) {
			args.push( '--watch' );
		} else {
			args.push( '--run' );
		}

		if ( options.coverage ) {
			args.push( '--coverage' );
		}

		for ( const projectName of repositoryPlan.projects ) {
			args.push( '--project', projectName );
		}

		const subprocess = spawn( 'pnpm', args, {
			stdio: 'inherit',
			cwd: repositoryPlan.repositoryRoot,
			shell: process.platform === 'win32'
		} );

		subprocess.on( 'error', error => {
			reject( error );
		} );

		subprocess.on( 'close', exitCode => {
			if ( exitCode === 0 ) {
				resolve();
			} else {
				reject( new Error( `Vitest finished with "${ exitCode }" code.` ) );
			}
		} );
	} );
}
