/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint node: true, strict: true */

'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const getKarmaConfig = require( '../utils/automated-tests/getkarmaconfig' );
const chalk = require( 'chalk' );
const glob = require( 'glob' );
const minimatch = require( 'minimatch' );
const mkdirp = require( 'mkdirp' );
const karmaLogger = require( 'karma/lib/logger.js' );
const { Server: KarmaServer } = require( 'karma' );
const transformFileOptionToTestGlob = require( '../utils/transformfileoptiontotestglob' );

// Glob patterns that should be ignored. It means if a specified test file is located under path
// that matches to these patterns, the file will be skipped.
const IGNORE_GLOBS = [
	// Ignore files which are saved in `manual/` directory. There are manual tests.
	path.join( '**', 'tests', '**', 'manual', '**', '*.js' ),
	// Ignore `_utils` directory as well because there are saved utils for tests.
	path.join( '**', 'tests', '**', '_utils', '**', '*.js' )
];

// An absolute path to the entry file that will be passed to Karma.
const ENTRY_FILE_PATH = path.join( process.cwd(), 'build', '.automated-tests', 'entry-point.js' );

module.exports = function runAutomatedTests( options ) {
	return Promise.resolve().then( () => {
		if ( !options.disallowConsoleUse ) {
			console.warn( chalk.yellow(
				'⚠ Console use is allowed. Use `--disallow-console-use` to disallow console use.'
			) );
		}

		const globPatterns = transformFilesToTestGlob( options.files );

		createEntryFile( globPatterns, options.disallowConsoleUse );

		const optionsForKarma = Object.assign( {}, options, {
			entryFile: ENTRY_FILE_PATH,
			globPatterns
		} );

		return runKarma( optionsForKarma );
	} );
};

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

function createEntryFile( globPatterns, disallowConsoleUse ) {
	mkdirp.sync( path.dirname( ENTRY_FILE_PATH ) );
	karmaLogger.setupFromConfig( { logLevel: 'INFO' } );

	const log = karmaLogger.create( 'config' );
	const allFiles = [];

	for ( const singlePattern of Object.keys( globPatterns ) ) {
		let hasFiles = false;

		for ( const resolvedPattern of globPatterns[ singlePattern ] ) {
			const files = glob.sync( resolvedPattern );

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

	const entryFileContent = allFiles
		.map( file => 'import "' + file + '";' );

	if ( disallowConsoleUse ) {
		entryFileContent.unshift( `
const originalWarn = console.warn;

beforeEach( () => {
	Object.getOwnPropertyNames( console ).forEach( method => {
		console[ method ] = ( ...data ) => {
			originalWarn( 'Detected \`console.' + method + '()\`:', ...data );
			throw new Error( 'Detected \`console.' + method + '()\`:' );
		}
	} );
} );
		` );
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

function runKarma( options ) {
	return new Promise( ( resolve, reject ) => {
		const config = getKarmaConfig( options );

		const server = new KarmaServer( config, exitCode => {
			if ( exitCode === 0 ) {
				resolve();
			} else {
				reject( new Error( `Karma finished with "${ exitCode }" code.` ) );
			}
		} );

		if ( options.coverage ) {
			const coveragePath = path.join( process.cwd(), 'coverage' );

			server.on( 'run_complete', () => {
				// Use timeout to not write to the console in the middle of Karma's status.
				setTimeout( () => {
					const { logger } = require( '@ckeditor/ckeditor5-dev-utils' );
					const log = logger();

					log.info( `Coverage report saved in '${ chalk.cyan( coveragePath ) }'.` );
				} );
			} );
		}

		server.start();
	} );
}
