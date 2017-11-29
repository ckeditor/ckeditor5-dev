/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint browser: false, node: true, strict: true */
'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const glob = require( 'glob' );
const minimatch = require( 'minimatch' );
const tmp = require( 'tmp' );
const karmaLogger = require( 'karma/lib/logger.js' );
const getWebpackConfigForAutomatedTests = require( './getwebpackconfig' );
const transformFileOptionToTestGlob = require( '../transformfileoptiontotestglob' );

const AVAILABLE_REPORTERS = [
	'mocha',
	'dots'
];

// Glob patterns that should be ignored. It means if specified test file
// match to these patterns, this file will be skipped.
const IGNORE_GLOBS = [
	// Ignore files which are saved in `manual/` directory. There are manual tests.
	path.join( '**', 'tests', '**', 'manual', '**', '*.js' ),
	// Ignore `_utils` directory as well because there are saved utils for tests.
	path.join( '**', 'tests', '**', '_utils', '**', '*.js' )
];

/**
 * @param {Object} options
 * @returns {Object|undefined}
 */
module.exports = function getKarmaConfig( options ) {
	const basePath = process.cwd();
	const coverageDir = path.join( basePath, 'coverage' );
	const log = karmaLogger.create( 'config' );

	if ( !Array.isArray( options.files ) || options.files.length === 0 ) {
		return log.error( 'Karma requires files to tests. `options.files` has to be non-empty array.' );
	}

	if ( !AVAILABLE_REPORTERS.includes( options.reporter ) ) {
		return log.error( 'Specified reporter is not supported. Available reporters: %s.', AVAILABLE_REPORTERS.join( ', ' ) );
	}

	const globPatterns = options.files.map( file => transformFileOptionToTestGlob( file ) );
	const allFiles = [];

	// We want to create a single entry point for Karma.
	// Every pattern must be resolved before Karma starts work.
	for ( const singlePattern of globPatterns ) {
		const files = glob.sync( singlePattern );

		if ( !files.length ) {
			log.warn( 'Pattern "%s" does not match any file.', singlePattern );
		}

		allFiles.push(
			...files.filter( file => !IGNORE_GLOBS.some( globPattern => minimatch( file, globPattern ) ) )
		);
	}

	if ( !allFiles.length ) {
		return log.error( 'Not found files to tests. Specified patterns are invalid.' );
	}

	const tempFile = tmp.fileSync( { postfix: '.js' } );

	const filesImports = allFiles
		.map( file => 'import "' + file + '";' )
		.join( '\n' );

	fs.writeFileSync( tempFile.name, filesImports );

	log.info( 'Entry file saved in "%s".', tempFile.name );

	const preprocessorMap = {
		[ tempFile.name ]: [ 'webpack' ]
	};

	if ( options.sourceMap ) {
		preprocessorMap[ tempFile.name ].push( 'sourcemap' );
	}

	const karmaConfig = {
		// Base path that will be used to resolve all patterns (eg. files, exclude).
		basePath,

		// Frameworks to use. Available frameworks: https://npmjs.org/browse/keyword/karma-adapter
		frameworks: [ 'mocha', 'chai', 'sinon' ],

		// List of files/patterns to load in the browser.
		files: [ tempFile.name ],

		// Preprocess matching files before serving them to the browser.
		// Available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
		preprocessors: preprocessorMap,

		webpack: getWebpackConfigForAutomatedTests( {
			files: options.files,
			sourceMap: options.sourceMap,
			coverage: options.coverage
		} ),

		webpackMiddleware: {
			noInfo: true,
			stats: {
				chunks: false
			}
		},

		// Test results reporter to use. Possible values: 'dots', 'progress'.
		// Available reporters: https://npmjs.org/browse/keyword/karma-reporter
		reporters: [ options.reporter ],

		// Web server port.
		port: 9876,

		// Enable/Disable colors in the output (reporters and logs).
		colors: true,

		// Level of logging. Possible values:
		// config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
		logLevel: 'INFO',

		// Start these browsers.
		// Available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
		browsers: getBrowsers( options ),

		customLaunchers: {
			CHROME_TRAVIS_CI: {
				base: 'Chrome',
				flags: [ '--no-sandbox', '--disable-background-timer-throttling' ]
			},
			CHROME_LOCAL: {
				base: 'Chrome',
				flags: [ '--disable-background-timer-throttling' ]
			},
		},

		// Continuous Integration mode. If true, Karma captures browsers, runs the tests and exits.
		singleRun: true,

		// Concurrency level. How many browser should be started simultaneous.
		concurrency: Infinity,

		// How long will Karma wait for a message from a browser before disconnecting from it (in ms).
		browserNoActivityTimeout: 0,

		// Shows differences in object comparison.
		mochaReporter: {
			showDiff: true
		},

		removeEntryFile() {
			return tempFile.removeCallback();
		}
	};

	if ( options.watch || options.server ) {
		// Enable/Disable watching file and executing tests whenever any file changes.
		karmaConfig.autoWatch = true;
		karmaConfig.singleRun = false;
	}

	if ( options.verbose ) {
		karmaConfig.webpackMiddleware.noInfo = false;
		delete karmaConfig.webpackMiddleware.stats;
	}

	if ( options.coverage ) {
		karmaConfig.reporters.push( 'coverage' );

		karmaConfig.coverageReporter = {
			reporters: [
				{
					type: 'text-summary'
				},
				{
					dir: coverageDir,
					type: 'html'
				},
				// Generates "./coverage/lcov.info". Used by CodeClimate.
				{
					type: 'lcovonly',
					subdir: '.',
					dir: coverageDir
				}
			]
		};
	}

	return karmaConfig;
};

// Returns the value of Karma's browser option.
// @returns {Array|null}
function getBrowsers( options ) {
	if ( process.env.TRAVIS ) {
		return [ 'CHROME_TRAVIS_CI' ];
	}

	if ( options.server || !options.browsers ) {
		return null;
	}

	return options.browsers.map( browser => {
		if ( browser === 'Chrome' ) {
			return 'CHROME_LOCAL';
		}

		return browser;
	} );
}
