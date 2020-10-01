/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint browser: false, node: true, strict: true */
'use strict';

const path = require( 'path' );
const getWebpackConfigForAutomatedTests = require( './getwebpackconfig' );

const AVAILABLE_REPORTERS = [
	'mocha',
	'dots'
];

/**
 * @param {Object} options
 * @returns {Object}
 */
module.exports = function getKarmaConfig( options ) {
	if ( !AVAILABLE_REPORTERS.includes( options.reporter ) ) {
		throw new Error( `Specified reporter is not supported. Available reporters: ${ AVAILABLE_REPORTERS.join( ', ' ) }.` );
	}

	const basePath = process.cwd();
	const coverageDir = path.join( basePath, 'coverage' );

	const preprocessorMap = {
		[ options.entryFile ]: [ 'webpack' ]
	};

	if ( options.sourceMap ) {
		preprocessorMap[ options.entryFile ].push( 'sourcemap' );
	}

	const karmaConfig = {
		// Base path that will be used to resolve all patterns (eg. files, exclude).
		basePath,

		// Frameworks to use. Available frameworks: https://npmjs.org/browse/keyword/karma-adapter
		frameworks: [ 'mocha', 'sinon-chai', 'webpack' ],

		// Files saved in directory `ckeditor5/packages/ckeditor5-utils/tests/_assets/` are available under: http://0.0.0.0:{port}/assets/
		proxies: {
			'/assets/': '/base/packages/ckeditor5-utils/tests/_assets/'
		},

		// List of files/patterns to load in the browser.
		files: [
			options.entryFile,
			{ pattern: 'packages/ckeditor5-utils/tests/_assets/**/*', watched: false, included: false, served: true, nocache: false }
		],

		// Preprocess matching files before serving them to the browser.
		// Available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
		preprocessors: preprocessorMap,

		webpack: getWebpackConfigForAutomatedTests( {
			files: Object.keys( options.globPatterns ).map( key => options.globPatterns[ key ] ),
			sourceMap: options.sourceMap,
			coverage: options.coverage,
			themePath: options.themePath,
			debug: options.debug
		} ),

		webpackMiddleware: {
			noInfo: true,
			stats: 'minimal'
		},

		// Test results reporter to use. Possible values: 'dots', 'progress'.
		// Available reporters: https://npmjs.org/browse/keyword/karma-reporter
		reporters: [ options.reporter ],

		// Web server port.
		port: options.port || 9876,

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
				flags: [ '--no-sandbox', '--disable-background-timer-throttling', '--js-flags="--expose-gc"' ]
			},
			CHROME_LOCAL: {
				base: 'Chrome',
				flags: [ '--disable-background-timer-throttling', '--js-flags="--expose-gc"', '--remote-debugging-port=9222' ]
			}
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
				// Prints a table after tests result.
				{
					type: 'text-summary'
				},
				// Generates HTML tables with the results.
				{
					dir: coverageDir,
					type: 'html'
				},
				{
					dir: coverageDir,
					type: 'json'
				},
				// Generates "lcov.info" file. It's used by external code coverage services.
				{
					type: 'lcovonly',
					dir: coverageDir
				}
			]
		};
	}

	if ( options.karmaConfigOverrides ) {
		// Add the plugins config with its default value, because if it'll be added by
		// the override, "karma-*" plugins will not be loaded and things will break.
		karmaConfig.plugins = [ 'karma-*' ];

		const overrides = require( options.karmaConfigOverrides );
		overrides( karmaConfig );
	}

	return karmaConfig;
};

// Returns the value of Karma's browser option.
// @returns {Array|null}
function getBrowsers( options ) {
	if ( options.server || !options.browsers ) {
		return null;
	}

	return options.browsers.map( browser => {
		if ( browser !== 'Chrome' ) {
			return browser;
		}

		return process.env.TRAVIS ? 'CHROME_TRAVIS_CI' : 'CHROME_LOCAL';
	} );
}
