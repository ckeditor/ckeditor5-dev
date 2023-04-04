/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

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

		// For unknown reasons, sometimes Karma does not fill the list automatically. So, all available plugins must be specified manually.
		plugins: [
			require.resolve( 'karma-chai' ),
			require.resolve( 'karma-chrome-launcher' ),
			require.resolve( 'karma-coverage' ),
			require.resolve( 'karma-firefox-launcher' ),
			require.resolve( 'karma-mocha' ),
			require.resolve( 'karma-mocha-reporter' ),
			require.resolve( 'karma-sinon' ),
			require.resolve( 'karma-sinon-chai' ),
			require.resolve( 'karma-sourcemap-loader' ),
			require.resolve( 'karma-webpack' )
		],

		// Files saved in directory `ckeditor5/packages/ckeditor5-utils/tests/_assets/` are available under: http://0.0.0.0:{port}/assets/
		proxies: {
			'/assets/': '/base/packages/ckeditor5-utils/tests/_assets/',

			// See: https://github.com/ckeditor/ckeditor5/issues/8823.
			'/example.com/image.png': '/base/packages/ckeditor5-utils/tests/_assets/sample.png',
			'/www.example.com/image.png': '/base/packages/ckeditor5-utils/tests/_assets/sample.png'
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
			...options,
			files: Object.keys( options.globPatterns ).map( key => options.globPatterns[ key ] )
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
				flags: getFlagsForBrowser( 'CHROME_TRAVIS_CI' )
			},
			CHROME_LOCAL: {
				base: 'Chrome',
				flags: getFlagsForBrowser( 'CHROME_LOCAL' )
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
			],
			watermarks: {
				statements: [ 50, 100 ],
				functions: [ 50, 100 ],
				branches: [ 50, 100 ],
				lines: [ 50, 100 ]
			}
		};
	}

	if ( options.karmaConfigOverrides ) {
		const overrides = require( options.karmaConfigOverrides );
		overrides( karmaConfig );

		// Watch for source files when running in Intellij IDE, for instance, WebStorm.
		// Otherwise, Karma compiles sources once, and the test bundle uses old code.
		// For the future reference: https://youtrack.jetbrains.com/issue/WEB-12496.
		karmaConfig.webpack.watch = true;

		// Remove "instrumenter" if coverage reporter was removed by overrides
		// (especially when debugging in Intellij IDE).
		if ( !karmaConfig.reporters.includes( 'coverage' ) && karmaConfig.webpack.module ) {
			const moduleRules = karmaConfig.webpack.module.rules;
			const ruleIdx = moduleRules.findIndex( rule => rule.loader === 'babel-loader' );

			if ( ruleIdx != -1 ) {
				moduleRules.splice( ruleIdx, 1 );
			}
		}
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

// Returns the array of configuration flags for given browser.
//
// @param {String} browser
// @returns {Array.<String>}
function getFlagsForBrowser( browser ) {
	const commonFlags = [
		'--disable-background-timer-throttling',
		'--js-flags="--expose-gc"',
		'--disable-renderer-backgrounding',
		'--disable-backgrounding-occluded-windows'
	];

	if ( browser === 'CHROME_TRAVIS_CI' ) {
		return [
			...commonFlags,
			'--no-sandbox'
		];
	}

	return [
		...commonFlags,
		'--remote-debugging-port=9222'
	];
}
