/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint browser: false, node: true, strict: true */
'use strict';

const path = require( 'path' );
const getWebpackConfigForAutomatedTests = require( './getwebpackconfig' );

const reporters = [
	'mocha',
	'dots'
];

const coverageDir = path.join( process.cwd(), 'coverage' );
const nodeModulesPath = path.join( process.cwd(), 'node_modules' );

/**
 * @param {Object} options
 * @returns {Object}
 */
module.exports = function getKarmaConfig( options ) {
	if ( !Array.isArray( options.files ) || options.files.length === 0 ) {
		throw new Error( 'Karma requires files to tests. `options.files` has to be non-empty array.' );
	}

	if ( !reporters.includes( options.reporter ) ) {
		throw new Error( `Given Mocha reporter is not supported. Available reporters: ${ reporters.join( ', ' ) }.` );
	}

	const files = options.files.map( file => fileOptionToGlob( file ) );

	const preprocessorMap = {};

	for ( const file of files ) {
		preprocessorMap[ file ] = [ 'webpack' ];

		if ( options.sourceMap ) {
			preprocessorMap[ file ].push( 'sourcemap' );
		}
	}

	const karmaConfig = {
		// Base path that will be used to resolve all patterns (eg. files, exclude).
		basePath: process.cwd(),

		// Frameworks to use. Available frameworks: https://npmjs.org/browse/keyword/karma-adapter
		frameworks: [ 'mocha', 'chai', 'sinon' ],

		// List of files/patterns to load in the browser.
		files,

		// List of files to exclude.
		exclude: [
			// Ignore all utils which aren't tests.
			path.join( '**', 'tests', '**', '_utils', '**', '*.js' ),

			// And all manual tests.
			path.join( '**', 'tests', '**', 'manual', '**', '*.js' )
		],

		// Preprocess matching files before serving them to the browser.
		// Available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
		preprocessors: preprocessorMap,

		webpack: getWebpackConfigForAutomatedTests( {
			files,
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
		browsers: options.browsers,

		customLaunchers: {
			CHROME_TRAVIS_CI: {
				base: 'Chrome',
				flags: [ '--no-sandbox' ]
			}
		},

		// Continuous Integration mode. If true, Karma captures browsers, runs the tests and exits.
		singleRun: true,

		// Concurrency level. How many browser should be started simultaneous.
		concurrency: Infinity,

		// How long will Karma wait for a message from a browser before disconnecting from it (in ms).
		browserNoActivityTimeout: 0
	};

	if ( process.env.TRAVIS ) {
		karmaConfig.browsers = [ 'CHROME_TRAVIS_CI' ];
	}

	if ( options.watch ) {
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

// Converts values of --files argument to proper globs.
// There are 5 supported types of values now:
//
// 0. current package's tests (when run in context of a package – e.g. on CI) - '/'
// 1. all packages' files – '*'
// 2. given package files – 'engine'
// 3. everything except the given package – '!engine'
// 4. path – 'engine/view' -> 'ckeditor5-engine/tests/view/**/*.js'
// 5. simplified glob – 'engine/view/**/*.js' -> 'ckeditor5-engine/tests/view/**/*.js'
function fileOptionToGlob( file ) {
	const chunks = file.split( '/' );
	const packageName = chunks.shift();
	const globSuffix = path.join( 'tests', '**', '*.js' );

	// 0.
	if ( file === '/' ) {
		return path.join( process.cwd(), globSuffix );
	}

	// 1. 2. 3.
	if ( chunks.length === 0 ) {
		// 1.
		if ( packageName == '*' ) {
			return path.join( nodeModulesPath, 'ckeditor5-!(dev)*', globSuffix );
		}

		// 3.
		if ( packageName.startsWith( '!' ) ) {
			return path.join( nodeModulesPath, 'ckeditor5-!(' + packageName.slice( 1 ) + ')*', globSuffix );
		}

		// 2.
		return path.join( nodeModulesPath, 'ckeditor5-' + packageName, globSuffix );
	}

	let glob = chunks.join( path.sep );

	// 4.
	if ( !glob.endsWith( '.js' ) ) {
		glob = path.join( glob, '**', '*.js' );
	}

	// 5.
	return path.join( nodeModulesPath, 'ckeditor5-' + packageName, 'tests', glob );
}
