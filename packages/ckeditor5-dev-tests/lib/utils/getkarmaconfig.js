/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint browser: false, node: true, strict: true */
'use strict';

const path = require( 'path' );
const getWebpackConfig = require( './getwebpackconfig' );
const getPathToPackage = require( '../../compiler-utils/getpathtopackage' );

const reporters = [
	'mocha',
	'dots',
];

const coverageDir = path.join( process.cwd(), 'build', '.coverage' );
const workspaceRoot = path.join( process.cwd(), '..' );

/**
 * Gets shortened path to file or package and returns fixed path.
 *
 * @param {String} fileOrPackage
 * @returns {String}
 */
function fixPathToGlobOrPackage( globOrPackage ) {
	if ( globOrPackage === '**/*.js' ) {
		return path.join( workspaceRoot, 'ckeditor5-!(dev)*', 'tests', '**', '*.js' );
	}

	if ( !globOrPackage.includes( '/' ) ) {
		return path.join( getPathToPackage( workspaceRoot, globOrPackage ), 'tests', '**', '*.js' );
	}

	return path.join( workspaceRoot, 'ckeditor5-' + globOrPackage );
}

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

	const files = options.files.map( globOrPackage => fixPathToGlobOrPackage( globOrPackage ) );

	const preprocessorMap = {};

	for ( const file of files ) {
		preprocessorMap[ file ] = [ 'webpack' ];

		if ( options.sourceMap ) {
			preprocessorMap[file].push( 'sourcemap' );
		}
	}

	const karmaConfig = {
		// Base path that will be used to resolve all patterns (eg. files, exclude).
		basePath: path.resolve( process.cwd(), '..' ),

		// Frameworks to use. Available frameworks: https://npmjs.org/browse/keyword/karma-adapter
		frameworks: [ 'mocha', 'chai', 'sinon' ],

		// List of files/patterns to load in the browser.
		files,

		// List of files to exclude.
		exclude: [
			// Ignore all utils which aren't tests.
			path.join( '**', 'tests', '**', '_utils', '**', '*.js' ),

			// And all manual tests.
			path.join( '**', 'tests', '**', 'manual', '**', '*.js' ),
		],

		// Preprocess matching files before serving them to the browser.
		// Available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
		preprocessors: preprocessorMap,

		webpack: getWebpackConfig( options ),

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
