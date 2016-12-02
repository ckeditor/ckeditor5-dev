/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs-extra' );
const path = require( 'path' );
const minimist = require( 'minimist' );
const glob = require( 'glob' );
const gutil = require( 'gulp-util' );
const { logger } = require( '@ckeditor/ckeditor5-dev-utils' );
const commonmark = require( 'commonmark' );
const combine = require( 'dom-combiner' );

const reader = new commonmark.Parser();
const writer = new commonmark.HtmlRenderer();

const utils = {
	coverageDirectory: 'coverage',

	/**
	 * Reporters for Karma.
	 * - 'mocha' - shows every test case as a long sentence,
	 * - 'dots' - shows tests as dots.
	 */
	reporters: [
		'mocha',
		'dots'
	],

	/**
	 * Returns a name of package based on current work directory.
	 *
	 * @param {String} [cwd=process.cwd()] cwd Current work directory.
	 * @returns {String}
	 */
	getPackageName( cwd = process.cwd() ) {
		const packageJson = require( path.join( cwd, 'package.json' ) );
		const matchedName = packageJson.name.match( /ckeditor5-(.*)/ );

		if ( !matchedName ) {
			throw new Error( 'The package name does not start with a "ckeditor5-".' );
		}

		// Temporary implementation of the UI lib option. See https://github.com/ckeditor/ckeditor5/issues/88.
		if ( matchedName[ 1 ] === 'ui-default' ) {
			return 'ui';
		}

		return matchedName[ 1 ];
	},

	/**
	 * @returns {Object} options
	 * @returns {String} options.sourcePath
	 * @returns {Array.<String>|null} options.files
	 * @returns {Array.<String>} options.browsers
	 * @returns {Boolean} [options.watch=false] options.watch
	 * @returns {Boolean} [options.coverage=false] options.coverage
	 * @returns {Boolean} [options.sourceMap=false] options.sourceMap
	 * @returns {Boolean} [options.verbose=false] options.verbose
	 * @returns {Boolean} [options.ignoreDuplicates] Whether to ignore duplicated packages. Packages can
	 * be duplicated if there are conflicts in dependency versions or when one of the packages is installed
	 * in the development mode (as a cloned repository).
	 * @returns {String} [options.reporter]
	 */
	parseArguments() {
		const options = minimist( process.argv.slice( 2 ), {
			string: [
				'files',
				'browsers',
				'reporter'
			],

			boolean: [
				'watch',
				'coverage',
				'source-map',
				'verbose',
				'ignore-duplicates'
			],

			alias: {
				w: 'watch',
				c: 'coverage',
				s: 'source-map',
				v: 'verbose',
			},

			default: {
				files: [],
				browsers: 'Chrome',
				reporter: 'mocha',
				watch: false,
				coverage: false,
				verbose: false,
				'source-map': false,
				'ignore-duplicates': false
			}
		} );

		options.ignoreDuplicates = options[ 'ignore-duplicates' ];
		options.sourceMap = options[ 'source-map' ];
		options.browsers = options.browsers.split( ',' );

		if ( typeof options.files === 'string' ) {
			options.files = options.files.split( ',' );
		}

		return options;
	},

	/**
	 * Returns an configuration object for Karma.
	 *
	 * @protected
	 * @param {Object} options
	 * @param {String} options.sourcePath Base path that will be used to resolve all patterns.
	 * @param {Boolean} options.watch Whether to watch the files and executing tests whenever any file changes.
	 * @param {Boolean} options.coverage Whether to generate code coverage.
	 * @param {Boolean} options.sourceMap Whether to generate the source maps.
	 * @param {Boolean} options.verbose Whether to informs about Webpack's work.
	 * @param {String} options.reporter Name of reporter that will be used to tests.
	 * @param {Array.<String>} options.browsers Browsers which will be used to run the tests.
	 * @param {Array.<String>} options.files Files to tests.
	 * @returns {Object}
	 */
	_getKarmaConfig( options ) {
		if ( !Array.isArray( options.files ) || options.files.length === 0 ) {
			throw new Error( 'Karma requires files to tests. `options.files` has to be non-empty array.' );
		}

		if ( !utils.reporters.includes( options.reporter ) ) {
			throw new Error( `Given Mocha reporter is not supported. Available reporters: ${ utils.reporters.join( ', ' ) }.` );
		}

		const karmaConfig = {
			// Base path that will be used to resolve all patterns (eg. files, exclude).
			basePath: options.sourcePath,

			// Frameworks to use. Available frameworks: https://npmjs.org/browse/keyword/karma-adapter
			frameworks: [ 'mocha', 'chai', 'sinon' ],

			// List of files/patterns to load in the browser.
			files: [],

			// List of files to exclude.
			exclude: [
				// Ignore all utils which aren't tests.
				path.join( 'tests', '**', '_utils', '**', '*.js' ),

				// And all manual tests.
				path.join( 'tests', '**', 'manual', '**', '*.js' ),
			],

			// Preprocess matching files before serving them to the browser.
			// Available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
			preprocessors: {
				'ckeditor5/**/*.js': [ 'webpack' ],
				'tests/**/*.js': [ 'webpack' ]
			},

			webpack: utils._getWebpackConfig( options ),

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

		if ( options.sourceMap ) {
			karmaConfig.preprocessors[ 'ckeditor5/**/*.js' ].push( 'sourcemap' );
			karmaConfig.preprocessors[ 'tests/**/*.js' ].push( 'sourcemap' );
		}

		if ( options.verbose ) {
			karmaConfig.webpackMiddleware.noInfo = false;
			delete karmaConfig.webpackMiddleware.stats;
		}

		if ( options.coverage ) {
			const coverageDir = path.join( options.sourcePath, utils.coverageDirectory );

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

		for ( const packageOrPath of options.files ) {
			if ( packageOrPath.endsWith( '.js' ) ) {
				karmaConfig.files.push( path.join( 'tests', packageOrPath ) );
			} else {
				karmaConfig.files.push( path.join( 'tests', packageOrPath, '**', '*.js' ) );
			}
		}

		return karmaConfig;
	},

	/**
	 * Returns an configuration object for Webpack.
	 *
	 * @protected
	 * @param {Object} options
	 * @param {String} options.sourcePath Base path that will be used to resolve all patterns.
	 * @param {Boolean} options.coverage Whether to generate code coverage.
	 * @param {Boolean} options.sourceMap Whether to generate the source maps.
	 * @param {Array.<String>} options.files Files to tests.
	 * @returns {Object}
	 */
	_getWebpackConfig( options ) {
		const webpackConfig = {
			resolve: {
				root: options.sourcePath
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
			let sep = utils._getDirectorySeparator();

			// Escape the backslash on Windows.
			if ( utils._getPlatform() === 'win32' ) {
				sep = sep.repeat( 2 );
			}

			if ( options.files ) {
				// Exclude coverage loader for all the directories except the testing ones.
				excludeTests = fs.readdirSync( path.join( options.sourcePath, 'ckeditor5' ) )
					.filter( ( dirName ) => {
						return !options.files
							.some( ( packageOrPath ) => packageOrPath.match( new RegExp( `^${ dirName }` ) ) );
					} )
					.map( ( dirName ) => new RegExp( [ 'ckeditor5', dirName ].join( sep ) ) );
			}

			webpackConfig.module.preLoaders.push( {
				test: /\.js$/,
				loader: 'istanbul-instrumenter',
				exclude: excludeTests.concat( [
					new RegExp( `${ sep }(node_modules|tests|theme|lib)${ sep }` )
				] ),
				query: {
					esModules: true
				}
			} );
		}

		if ( options.sourceMap ) {
			webpackConfig.devtool = 'eval';
		}

		return webpackConfig;
	},

	/**
	 * Returns paths to the JS files of manual tests.
	 *
	 * The paths are relative to `sourcePath`.
	 *
	 * @protected
	 * @param {String} sourcePath Base path to the all sources.
	 * @return {Array.<String>}
	 */
	_getManualTestPaths( sourcePath ) {
		const sep = utils._getDirectorySeparator();

		const globPattern = [
			// Glob does not understand the backslash in paths on Windows.
			...sourcePath.split( sep ),
			'tests',
			'**',
			'manual',
			'**',
			'*.js'
		].join( '/' );

		return utils._glob( globPattern )
			.map( ( absolutePath ) => absolutePath.replace( `${ sourcePath }${ sep }`, '' ) );
	},

	/**
	 * Returns paths to all files which are not manual tests. These files
	 * can be required by manual tests (e.g. images).
	 *
	 * The paths are relative to `sourcePath`.
	 *
	 * @protected
	 * @param {String} sourcePath Base path to the all sources.
	 * @return {Array.<String>}
	 */
	_getManualTestAssetPaths( sourcePath ) {
		const sep = utils._getDirectorySeparator();

		const globPattern = [
			// Glob does not understand the backslash in paths on Windows.
			...sourcePath.split( sep ),
			'tests',
			'**',
			'manual',
			'**',
			'*.*'
		].join( '/' );

		// All manual test files (including views and scripts).
		const allFiles = utils._glob( globPattern )
			.map( ( absolutePath ) => absolutePath.replace( `${ sourcePath }${ sep }`, '' ) );

		// Views, descriptions and scripts with manual tests.
		const manualTestFiles = utils._getManualTestPaths( sourcePath )
			.reduce( ( arr, item ) => {
				arr.push( item );
				arr.push( item.replace( /\.js$/, '.html' ) );
				arr.push( item.replace( /\.js$/, '.md' ) );

				return arr;
			}, [] );

		// In order to get static files, we need to compare two array.
		return allFiles.filter( ( item ) => !manualTestFiles.includes( item ) );
	},

	/**
	 * Removes `manual/` directories from the path.
	 *
	 * @protected
	 * @param {String} pathToClean
	 * @returns {String}
	 */
	_cleanManualTestPath( pathToClean ) {
		const sep = utils._getDirectorySeparator();

		return pathToClean.split( sep )
			.filter( ( dirName ) => dirName !== 'manual' )
			.join( sep );
	},

	/**
	 * Get the `config.entries` object for Webpack. The entries represents
	 * JS files to build.
	 *
	 * @protected
	 * @param {String} sourcePath Base path to the all sources.
	 * @return {Object}
	 */
	_getWebpackEntriesForManualTests( sourcePath ) {
		const entries = {};

		for ( const testPath of utils._getManualTestPaths( sourcePath ) ) {
			entries[ utils._cleanManualTestPath( testPath ) ] = testPath;
		}

		return entries;
	},

	/**
	 * Watches given paths. When a file is modified, the handler will be executed.
	 * The handler will call 500ms after the last change in file.
	 *
	 * @protected
	 * @param {Array.<String>} absolutePaths Paths that will be watched.
	 * @param {Function} handler Handler that will be executed after detected the changes in file.
	 */
	_watchFiles( absolutePaths, handler ) {
		let timerId;

		for ( const itemPath of absolutePaths ) {
			fs.watch( itemPath, () => {
				if ( timerId ) {
					clearTimeout( timerId );
				}

				timerId = setTimeout( () => {
					timerId = null;

					handler( itemPath );
				}, 500 );
			} );
		}
	},

	/**
	 * Compiles an HTML file of a manual tests out of a source Markdown and HTML files.
	 *
	 * @protected
	 * @param {String} sourcePath Base path to the all sources.
	 * @param {String} outputPath Path where compiled test will be saved.
	 * @param {String} pathToFile Absolute path to compiled HTML or Markdown file.
	 * @param {String} viewTemplate Template with the whole page.
	 */
	_compileView( sourcePath, outputPath, pathToFile, viewTemplate ) {
		const log = logger();
		log.info( `[View] Processing '${ gutil.colors.cyan( pathToFile ) }'...` );

		const pathWithoutExtension = pathToFile.replace( /\.(md|html)$/, '' );

		// Compile test instruction (Markdown file).
		const parsedMarkdownTree = reader.parse( fs.readFileSync( `${ pathWithoutExtension }.md`, 'utf-8' ) );
		const manualTestInstructions = '<div class="manual-test-sidebar">' + writer.render( parsedMarkdownTree ) + '</div>';

		// Load test view (HTML file).
		const htmlView = fs.readFileSync( `${ pathWithoutExtension }.html`, 'utf-8' );

		// Attach script file to the view.
		const scriptTag = `<body class="manual-test-container"><script src="./${ path.basename( pathWithoutExtension ) }.js"></script></body>`;

		// Concat the all HTML parts to single one.
		const preparedHtml = combine( viewTemplate, manualTestInstructions, htmlView, scriptTag );

		// Prepare output path.
		const outputFilePath = utils._cleanManualTestPath( `${ pathWithoutExtension.replace( sourcePath, outputPath ) }.html` );

		fs.outputFileSync( outputFilePath, preparedHtml );

		log.info( `[View] Finished writing '${ gutil.colors.cyan( pathToFile ) }'` );
	},

	/**
	 * Returns a name of platform which executing this script.
	 *
	 * It allows to mock the platform in other tests.
	 *
	 * @protected
	 * @returns {String}
	 */
	_getPlatform() {
		return process.platform;
	},

	/**
	 * Returns a separator in paths used on current platform.
	 *
	 * It allows to mock the value in other tests.
	 *
	 * @protected
	 * @returns {String}
	 */
	_getDirectorySeparator() {
		return path.sep;
	},

	/**
	 * Wraps the `glob.sync` method. Returned array contains fixed paths
	 * to files on Windows.
	 *
	 * @protected
	 * @param {String} pattern
	 * @return {Array.<String>}
	 */
	_glob( pattern ) {
		const files = glob.sync( pattern );

		// Glob always returns paths separated by '/'. This is incorrect on Windows.
		if ( utils._getPlatform() === 'win32' ) {
			return files.map( ( absolutePath ) => absolutePath.replace( /\//g, '\\' ) );
		}

		return files;
	}
};

module.exports = utils;
