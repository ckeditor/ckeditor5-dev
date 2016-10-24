/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const minimist = require( 'minimist' );
const KarmaServer = require( 'karma' ).Server;

const utils = {
	/**
	 * @param {Object} options
	 * @param {String} options.rootPath Base path that will be used to resolve all patterns.
	 * @param {Boolean} options.watch Whether to watch the files and executing tests whenever any file changes.
	 * @param {Boolean} options.coverage Whether to generate code coverage.
	 * @param {Boolean} options.sourcemap Whether to generate the source maps.
	 * @param {Boolean} options.verbose Whether to informs about Webpack's work.
	 * @param {Array.<String>} options.browsers Browsers used to run the tests.
	 * @param {String} [options.packagesOrPaths=null] options.packagesOrPaths Name of packages or paths to the directory to test.
	 * @returns {Object}
	 */
	getKarmaConfig( options ) {
		const karmaConfig = {
			// Base path that will be used to resolve all patterns (eg. files, exclude).
			basePath: options.rootPath,

			// Frameworks to use. Available frameworks: https://npmjs.org/browse/keyword/karma-adapter
			frameworks: [ 'mocha', 'chai', 'sinon' ],

			// List of files/patterns to load in the browser.
			files: [
				path.join( 'tests', '**', '*.js' )
			],

			// List of files to exclude.
			exclude: [
				// Ignore all utils which aren't tests.
				path.join( 'tests', '**', '_utils', '**', '*.js' ),

				// All manual tests.
				path.join( 'tests', '**', 'manual', '**', '*.js' ),

				// And all tickets tests (most probably they are also the manual tests).
				path.join( 'tests', '**', 'tickets', '**', '*.js' ),
			],

			// Preprocess matching files before serving them to the browser.
			// Available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
			preprocessors: {
				'ckeditor5/**/*.js': [ 'webpack' ],
				'tests/**/*.js': [ 'webpack' ]
			},

			webpack: utils.getWebpackConfig( options ),

			webpackMiddleware: {
				noInfo: true,
				stats: {
					chunks: false
				}
			},

			// Test results reporter to use. Possible values: 'dots', 'progress'.
			// Available reporters: https://npmjs.org/browse/keyword/karma-reporter
			reporters: [ 'mocha' ],

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

			// Continuous Integration mode. If true, Karma captures browsers, runs the tests and exits.
			singleRun: true,

			// Concurrency level. How many browser should be started simultaneous.
			concurrency: Infinity,
		};

		if ( options.watch ) {
			// Enable/Disable watching file and executing tests whenever any file changes.
			karmaConfig.autoWatch = true;
			karmaConfig.singleRun = false;
		}

		if ( options.sourcemap ) {
			karmaConfig.preprocessors[ 'ckeditor5/**/*.js' ].push( 'sourcemap' );
			karmaConfig.preprocessors[ 'tests/**/*.js' ].push( 'sourcemap' );
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
						dir: '../coverage/',
						type: 'html'
					}
				]
			};
		}

		if ( options.packagesOrPaths ) {
			karmaConfig.files = [];

			for ( const packagesOrPaths of options.packagesOrPaths.split( ',' ) ) {
				const resolvedPath = path.join( options.rootPath, packagesOrPaths );

				// If given path directs to a directory.
				if ( fs.lstatSync( resolvedPath ).isDirectory() ) {
					// Then take all files from given path.
					karmaConfig.files.push( path.join( 'tests', packagesOrPaths, '**', '*.js' ) );
				} else {
					// Most probably the path directs to single file.
					karmaConfig.files.push( path.join( 'tests', packagesOrPaths ) );
				}
			}
		}

		return karmaConfig;
	},

	/**
	 * @param {Object} options
	 * @param {String} options.rootPath Base path that will be used to resolve all patterns.
	 * @param {Boolean} options.coverage Whether to generate code coverage.
	 * @param {Boolean} options.sourcemap Whether to generate the source maps.
	 * @param {String} [options.packagesOrPaths=null] options.packagesOrPaths Name of package or path to the directory to test.
	 * @returns {Object}
	 */
	getWebpackConfig( options ) {
		const webpackConfig = {
			resolve: {
				root: options.rootPath
			},
			module: {
				preLoaders: [
					{
						test: /\.js$/,
						exclude: /(node_modules)/,
						loader: 'babel',
						query: {
							cacheDirectory: true,
							plugins: [ 'transform-es2015-modules-commonjs' ]
						}
					}
				]
			},
			plugins: []
		};

		if ( options.coverage ) {
			let excludeTests = [];

			if ( options.packagesOrPaths ) {
				// Exclude coverage loader for all the directories except the testing ones.
				excludeTests = fs.readdirSync( path.join( options.rootPath, 'tests' ) )
					.filter( ( dirName ) => {
						return options.packagesOrPaths.split( ',' ).some( ( packageOrPath ) => {
							return new RegExp( `^${ dirName }` ).match( packageOrPath );
						} );
					} )
					.map( ( dirName ) => new RegExp( path.join( 'ckeditor5', dirName ) ) );
			}

			webpackConfig.module.preLoaders.push( {
				test: /\.js$/,
				loader: 'istanbul-instrumenter',
				exclude: excludeTests.concat( [
					/(node_modules)/,
					/tests/,
					/theme/
				] ),
				query: {
					esModules: true
				}
			} );
		}

		if ( options.sourcemap ) {
			webpackConfig.devtool = 'eval';
		}

		return webpackConfig;
	},

	/**
	 * @param {Object} options
	 * @param {String} options.rootPath Base path that will be used to resolve all patterns.
	 * @param {Boolean} options.watch Whether to watch the files and executing tests whenever any file changes.
	 * @param {Boolean} options.coverage Whether to generate code coverage.
	 * @param {Boolean} options.sourcemap Whether to generate the source maps.
	 * @param {Boolean} options.verbose Whether to informs about Webpack's work.
	 * @param {Array.<String>} options.browsers Browsers used to run the tests.
	 * @param {String} [options.packagesOrPaths=null] options.packagesOrPaths Name of packages or paths to the directory to test.
	 * @param {Function} [callback=null] Callback which is called when Karma finishes work.
	 */
	runKarma( options, callback = null ) {
		new KarmaServer( options, callback ).start();
	},

	/**
	 * Returns a name of package for current work directory.
	 *
	 * @throws {Error}
	 * @returns {String}
	 */
	getPackageName() {
		let packageJson = require( path.join( process.cwd(), 'package.json' ) );
		const matchedName = /^ckeditor5-(.*)/.match( packageJson.name );

		if ( !matchedName ) {
			throw new Error( 'Cannot find string starting with "ckeditor5-".' );
		}

		return matchedName[ 1 ];
	},

	/**
	 * @returns {Object} options
	 * @returns {String|null} options.packagesOrPaths
	 * @returns {Array.<String>} options.browsers
	 * @returns {Boolean} [options.watch=false] options.watch
	 * @returns {Boolean} [options.coverage=false] options.coverage
	 * @returns {Boolean} [options.sourcemap=false] options.sourcemap
	 * @returns {Boolean} [options.verbose=false] options.verbose
	 */
	parseArguments() {
		const options = minimist( process.argv.slice( 2 ), {
			string: [
				'packagesOrPaths',
				'browsers'
			],

			boolean: [
				'watch',
				'coverage',
				'sourcemap',
				'verbose'
			],

			alias: {
				w: 'watch',
				c: 'coverage',
				s: 'sourcemap',
				v: 'verbose',
				packages: 'packagesOrPaths'
			},

			default: {
				packages: null,
				browsers: 'Chrome',
				watch: false,
				coverage: false,
				verbose: false,
				sourcmap: false
			}
		} );

		options.browsers = options.browsers.split( ',' );

		return options;
	}
};

module.exports = utils;
