/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs';
import { styleText } from 'util';
import { logger } from '@ckeditor/ckeditor5-dev-utils';
import getKarmaConfig from '../utils/automated-tests/getkarmaconfig.js';
import { globSync } from 'tinyglobby';
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

// An absolute path to the entry file that will be passed to Karma.
const ENTRY_FILE_PATH = upath.join( process.cwd(), 'build', '.automated-tests', 'entry-point.js' );

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

		createEntryFile( globPatterns, options.production );

		const optionsForKarma = Object.assign( {}, options, {
			entryFile: ENTRY_FILE_PATH,
			globPatterns
		} );

		return runKarma( optionsForKarma );
	} );
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

function createEntryFile( globPatterns, production ) {
	mkdirp.sync( upath.dirname( ENTRY_FILE_PATH ) );
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

	if ( !allFiles.length ) {
		throw new Error( 'Not found files to tests. Specified patterns are invalid.' );
	}

	// Set global license key in the `before` hook.
	allFiles.unshift( upath.join( import.meta.dirname, '..', 'utils', 'automated-tests', 'licensekeybefore.js' ) );

	// Inject the leak detector root hooks. Need to be split into two parts due to #598.
	allFiles.splice( 0, 0, upath.join( import.meta.dirname, '..', 'utils', 'automated-tests', 'leaksdetectorbefore.js' ) );
	allFiles.push( upath.join( import.meta.dirname, '..', 'utils', 'automated-tests', 'leaksdetectorafter.js' ) );

	const entryFileContent = allFiles
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

	fs.writeFileSync( ENTRY_FILE_PATH, entryFileContent.join( '\n' ) + '\n' );

	// Webpack watcher compiles the file in a loop. It causes to Karma that runs tests multiple times in watch mode.
	// A ugly hack blocks the loop and tests are executed once.
	// See: https://github.com/webpack/watchpack/issues/25.
	const now = Date.now() / 1000;
	// 10 sec is default value of FS_ACCURENCY (which is hardcoded in Webpack watcher).
	const then = now - 10;
	fs.utimesSync( ENTRY_FILE_PATH, then, then );
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
