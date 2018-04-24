/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
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
		frameworks: [ 'mocha', 'chai', 'sinon' ],

		// List of files/patterns to load in the browser.
		files: [ options.entryFile ],

		// Preprocess matching files before serving them to the browser.
		// Available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
		preprocessors: preprocessorMap,

		webpack: getWebpackConfigForAutomatedTests( {
			files: Object.keys( options.globPatterns ).map( key => options.globPatterns[ key ] ),
			sourceMap: options.sourceMap,
			coverage: options.coverage,
			themePath: options.themePath
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
			BrowserStack_Edge: {
				base: 'BrowserStack',
				os: 'Windows',
				os_version: '10',
				browser: 'edge'
			},
			BrowserStack_Safari: {
				base: 'BrowserStack',
				os: 'OS X',
				os_version: 'High Sierra',
				browser: 'safari'
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

	if ( shouldEnableBrowserStack() ) {
		karmaConfig.browserStack = {
			username: process.env.BROWSER_STACK_USERNAME,
			accessKey: process.env.BROWSER_STACK_ACCESS_KEY,
			build: process.env.TRAVIS_REPO_SLUG,
			project: 'ckeditor5'
		};

		karmaConfig.reporters = [ 'dots', 'BrowserStack' ];
	}

	if ( options.coverage ) {
		karmaConfig.reporters.push( 'coverage' );

		if ( process.env.TRAVIS ) {
			karmaConfig.reporters.push( 'coveralls' );
		}

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
				// Generates "lcov.info" file. It's used by external code coverage services.
				{
					type: 'lcovonly',
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
	if ( options.server || !options.browsers ) {
		return null;
	}

	const browsers = options.browsers
		.map( browser => {
			if ( browser !== 'Chrome' ) {
				return browser;
			}

			return process.env.TRAVIS ? 'CHROME_TRAVIS_CI' : 'CHROME_LOCAL';
		} );

	if ( shouldEnableBrowserStack() ) {
		return browsers;
	}

	// If the BrowserStack is disabled, all browsers that start with a prefix "BrowserStack" should be filtered out.
	// See: https://github.com/ckeditor/ckeditor5-dev/issues/358 and https://github.com/ckeditor/ckeditor5-dev/issues/402.
	return browsers.filter( browser => !browser.startsWith( 'BrowserStack' ) );
}

function shouldEnableBrowserStack() {
	if ( !process.env.BROWSER_STACK_USERNAME ) {
		return false;
	}

	if ( !process.env.BROWSER_STACK_ACCESS_KEY ) {
		return false;
	}

	// If the repository slugs are different, the pull request comes from the community (forked repository).
	// For such builds, BrowserStack will be disabled. Read more: https://github.com/ckeditor/ckeditor5-dev/issues/358.
	return ( process.env.TRAVIS_EVENT_TYPE !== 'pull_request' || process.env.TRAVIS_PULL_REQUEST_SLUG === process.env.TRAVIS_REPO_SLUG );
}
