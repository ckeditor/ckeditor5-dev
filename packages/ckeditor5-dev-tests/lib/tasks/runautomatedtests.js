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

export default async function runAutomatedTests( options ) {
	if ( !options.production ) {
		console.warn( styleText(
			'yellow',
			'⚠ You\'re running tests in dev mode - some error protections are loose. Use the `--production` flag ' +
			'to use strictest verification methods.'
		) );
	}

	const globPatterns = resolveTestGlobs( options.files );
	const testFiles = collectTestFiles( globPatterns );
	const { karmaFiles, vitestSelection } = partitionByRunner( testFiles );

	if ( !karmaFiles.length && !vitestSelection.length ) {
		throw new Error( 'No test files found. Specified patterns are invalid.' );
	}

	if ( karmaFiles.length && vitestSelection.length && options.watch ) {
		throw new Error(
			'Watch mode cannot be used in a mixed Karma + Vitest run. ' +
			'Run watch mode separately for Karma and Vitest packages.'
		);
	}

	if ( options.watch && vitestSelection.length > 1 ) {
		throw new Error(
			'Watch mode cannot be used for multiple Vitest projects in one run. ' +
			'Run watch mode separately for each Vitest project.'
		);
	}

	const errors = [];

	if ( karmaFiles.length ) {
		try {
			await runKarmaTests( options, karmaFiles );
		} catch ( error ) {
			errors.push( error );
		}
	}

	if ( vitestSelection.length ) {
		try {
			await spawnVitest( options, vitestSelection );
		} catch ( error ) {
			errors.push( error );
		}
	}

	if ( errors.length ) {
		throw aggregateErrors( errors );
	}
}

// -- Glob resolution & file collection -----------------------------------------------------------

function resolveTestGlobs( files ) {
	if ( !Array.isArray( files ) || files.length === 0 ) {
		throw new Error( 'Test runner requires files to test. `options.files` has to be a non-empty array.' );
	}

	const globMap = {};

	for ( const file of files ) {
		globMap[ file ] = transformFileOptionToTestGlob( file );
	}

	return globMap;
}

function collectTestFiles( globPatterns ) {
	karmaLogger.setupFromConfig( { logLevel: 'INFO' } );

	const log = karmaLogger.create( 'config' );
	const allFiles = [];

	for ( const [ pattern, resolvedGlobs ] of Object.entries( globPatterns ) ) {
		let hasFiles = false;

		for ( const glob of resolvedGlobs ) {
			const files = globSync( glob ).map( f => upath.normalize( f ) );

			if ( files.length ) {
				hasFiles = true;
			}

			allFiles.push(
				...files.filter( file => !IGNORE_GLOBS.some( ignore => minimatch( file, ignore ) ) )
			);
		}

		if ( !hasFiles ) {
			log.warn( 'Pattern "%s" does not match any file.', pattern );
		}
	}

	return allFiles;
}

// -- Runner partitioning --------------------------------------------------------------------------

function partitionByRunner( testFiles ) {
	const karmaFiles = [];
	const vitestSelection = new Map();
	const runnerCache = new Map();

	for ( const filePath of testFiles ) {
		const packageRoot = getPackageRoot( filePath );

		if ( !runnerCache.has( packageRoot ) ) {
			runnerCache.set( packageRoot, detectPackageRunner( packageRoot ) );
		}

		const { runner, projectName } = runnerCache.get( packageRoot );

		if ( runner === 'vitest' ) {
			const files = vitestSelection.get( projectName ) || [];
			files.push( filePath );
			vitestSelection.set( projectName, files );
		} else {
			karmaFiles.push( filePath );
		}
	}

	return { karmaFiles, vitestSelection: [ ...vitestSelection.entries() ] };
}

function getPackageRoot( filePath ) {
	const normalized = upath.normalize( filePath );
	const testsIndex = normalized.lastIndexOf( '/tests/' );

	if ( testsIndex === -1 ) {
		throw new Error( `Cannot determine package root for "${ filePath }".` );
	}

	return normalized.slice( 0, testsIndex );
}

function detectPackageRunner( packageRoot ) {
	const projectName = upath.basename( packageRoot ).replace( /^ckeditor5-/, '' );
	const packageJson = JSON.parse( fs.readFileSync( upath.join( packageRoot, 'package.json' ), 'utf8' ) );
	const runner = packageJson.scripts?.test?.includes( 'vitest' ) ? 'vitest' : 'karma';

	return { projectName, runner };
}

// -- Karma runner ---------------------------------------------------------------------------------

async function runKarmaTests( options, karmaFiles ) {
	const entryFilePath = upath.join( process.cwd(), 'build', '.automated-tests', 'entry-point.js' );

	createKarmaEntryFile( entryFilePath, karmaFiles, options.production );

	// Build globPatterns from karmaFiles only, so the coverage loader instruments
	// just the Karma packages' source code — not Vitest packages that happen to be
	// imported transitively.
	return startKarmaServer( {
		...options,
		entryFile: entryFilePath,
		globPatterns: { karma: karmaFiles }
	} );
}

function createKarmaEntryFile( entryFilePath, files, production ) {
	const utilsDir = upath.join( import.meta.dirname, '..', 'utils', 'automated-tests' );
	const testImports = [ ...files ];

	// Set global license key in the `before` hook.
	testImports.unshift( upath.join( utilsDir, 'licensekeybefore.js' ) );

	// Inject the leak detector root hooks. Need to be split into two parts due to #598.
	testImports.splice( 0, 0, upath.join( utilsDir, 'leaksdetectorbefore.js' ) );
	testImports.push( upath.join( utilsDir, 'leaksdetectorafter.js' ) );

	const entryLines = testImports.map( file => `import "${ file }";` );

	// Inject the custom chai assertions. See ckeditor/ckeditor5#9668.
	const assertionsDir = upath.join( utilsDir, 'assertions' );
	const customAssertions = fs.readdirSync( assertionsDir ).map( assertionFileName => {
		return [
			assertionFileName,
			upath.parse( assertionFileName ).name.replace( /-([a-z])/g, value => value[ 1 ].toUpperCase() )
		];
	} );

	// Two loops are needed to achieve correct order in `ckeditor5/build/.automated-tests/entry-point.js`.
	for ( const [ fileName, functionName ] of customAssertions ) {
		entryLines.push( `import ${ functionName }Factory from "${ assertionsDir }/${ fileName }";` );
	}
	for ( const [ , functionName ] of customAssertions ) {
		entryLines.push( `${ functionName }Factory( chai );` );
	}

	if ( production ) {
		entryLines.unshift( assertConsoleUsageToThrowErrors() );
	}

	mkdirp.sync( upath.dirname( entryFilePath ) );
	fs.writeFileSync( entryFilePath, entryLines.join( '\n' ) + '\n' );

	// Webpack watcher compiles the file in a loop. It causes to Karma that runs tests multiple times in watch mode.
	// A ugly hack blocks the loop and tests are executed once.
	// See: https://github.com/webpack/watchpack/issues/25.
	const now = Date.now() / 1000;
	// 10 sec is default value of FS_ACCURENCY (which is hardcoded in Webpack watcher).
	const then = now - 10;
	fs.utimesSync( entryFilePath, then, then );
}

function startKarmaServer( options ) {
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

// -- Vitest runner --------------------------------------------------------------------------------

async function spawnVitest( options, vitestSelection ) {
	for ( const [ project, selectedFiles ] of vitestSelection ) {
		await spawnVitestProject( options, project, selectedFiles );
	}

	if ( options.coverage ) {
		await mergeVitestCoverage( vitestSelection );
	}
}

function spawnVitestProject( options, project, selectedFiles ) {
	return new Promise( ( resolve, reject ) => {
		const args = [ 'vitest' ];

		args.push( options.watch ? '--watch' : '--run' );

		if ( options.coverage ) {
			const coverageDir = upath.join( process.cwd(), 'coverage-vitest', project );
			args.push( '--coverage', '--coverage.reportsDirectory', coverageDir );
		}

		args.push( '--project', project );

		for ( const filePath of selectedFiles ) {
			args.push( upath.relative( process.cwd(), filePath ) );
		}

		const child = spawn( 'pnpm', args, {
			stdio: 'inherit',
			cwd: process.cwd(),
			shell: process.platform === 'win32'
		} );

		child.on( 'error', reject );

		child.on( 'close', exitCode => {
			if ( exitCode === 0 || exitCode === 130 ) {
				resolve();
			} else {
				reject( new Error( `Vitest finished with "${ exitCode }" code.` ) );
			}
		} );
	} );
}

function mergeVitestCoverage( vitestSelection ) {
	const cwd = process.cwd();
	const coverageBaseDir = upath.join( cwd, 'coverage-vitest' );
	const nycOutputDir = upath.join( coverageBaseDir, '.nyc_output' );

	mkdirp.sync( nycOutputDir );

	// Copy each project's coverage-final.json into .nyc_output/ so nyc can merge them.
	for ( const [ project ] of vitestSelection ) {
		const sourceFile = upath.join( coverageBaseDir, project, 'coverage-final.json' );

		if ( fs.existsSync( sourceFile ) ) {
			fs.copyFileSync( sourceFile, upath.join( nycOutputDir, `${ project }.json` ) );
		}
	}

	const log = logger();

	return new Promise( ( resolve, reject ) => {
		const child = spawn( 'pnpx', [
			'nyc', 'report',
			'--temp-dir', nycOutputDir,
			'--report-dir', coverageBaseDir,
			'--reporter', 'html',
			'--reporter', 'json',
			'--reporter', 'lcovonly',
			'--reporter', 'text-summary'
		], {
			stdio: 'inherit',
			cwd,
			shell: process.platform === 'win32'
		} );

		child.on( 'error', reject );

		child.on( 'close', exitCode => {
			if ( exitCode === 0 ) {
				log.info( `Combined Vitest coverage report saved in '${ styleText( 'cyan', coverageBaseDir ) }'.` );
				resolve();
			} else {
				reject( new Error( `nyc report finished with "${ exitCode }" code.` ) );
			}
		} );
	} );
}

// -- Error handling -------------------------------------------------------------------------------

function aggregateErrors( errors ) {
	if ( errors.length === 1 ) {
		return errors[ 0 ];
	}

	const details = errors.map( e => `- ${ e.message }` ).join( '\n' );
	return new Error( `Test execution failed in multiple runners:\n${ details }` );
}

// -- Console assertion (production mode) ----------------------------------------------------------

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
