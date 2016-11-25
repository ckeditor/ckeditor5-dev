/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* global setTimeout, clearTimeout */

'use strict';

const path = require( 'path' );
const fs = require( 'fs-extra' );
const gutil = require( 'gulp-util' );
const { logger } = require( '@ckeditor/ckeditor5-dev-utils' );
const compiler = require( '@ckeditor/ckeditor5-dev-compiler' );
const webpack = require( 'webpack' );
const KarmaServer = require( 'karma' ).Server;
const utils = require( './utils' );
const NotifierPlugin = require( './notifier-plugin' );

const tasks = {
	automated: {
		/**
		 * Run the tests.
		 *
		 * @param {Object} options
		 * @param {String} options.sourcePath Path to the CKEditor 5 compiled source.
		 * @param {Boolean} options.watch Whether to watch the files and executing tests whenever any file changes.
		 * @param {Boolean} options.coverage Whether to generate code coverage.
		 * @param {Boolean} options.sourceMap Whether to generate the source maps.
		 * @param {Boolean} options.verbose Whether to informs about Webpack's work.
		 * @param {Array.<String>} options.browsers Browsers which will be used to run the tests.
		 * @param {Array.<String>} options.files Specify path(s) to tests.
		 * @returns {Promise}
		 */
		runTests( options ) {
			return new Promise( ( resolve, reject ) => {
				const config = utils._getKarmaConfig( options );

				const server = new KarmaServer( config, ( exitCode ) => {
					if ( exitCode === 0 ) {
						resolve();
					} else {
						reject();

						process.exit( exitCode );
					}
				} );

				if ( options.coverage ) {
					const coveragePath = path.join( options.sourcePath, utils.coverageDirectory );

					server.on( 'run_complete', () => {
						// Use timeout to not write to the console in the middle of Karma's status.
						setTimeout( () => {
							const { logger } = require( '@ckeditor/ckeditor5-dev-utils' );
							const log = logger();

							log.info( `Coverage report saved in '${ gutil.colors.cyan( coveragePath ) }'.` );
						} );
					} );
				}

				server.start();
			} );
		},

		/**
		 * Compiles the project and runs the tests.
		 *
		 * @param {Object} options
		 * @param {Boolean} options.watch Whether to watch the files and executing tests whenever any file changes.
		 * @param {Boolean} options.coverage Whether to generate code coverage.
		 * @param {Boolean} options.sourceMap Whether to generate the source maps.
		 * @param {Boolean} options.verbose Whether to informs about Webpack's work.
		 * @param {Array.<String>} options.packages Paths to CKEditor 5 dependencies.
		 * @param {Array.<String>} options.browsers Browsers which will be used to run the tests.
		 * @param {Array.<String>} options.files Specify path(s) to tests.
		 * @param {Boolean} options.ignoreDuplicates Whether to ignore duplicated packages.
		 * @returns {Promise}
		 */
		test( options ) {
			const { logger } = require( '@ckeditor/ckeditor5-dev-utils' );
			const log = logger();

			let waitUntil = new Date().getTime() + 500;

			options.sourcePath = path.resolve( './.build/' );

			return new Promise( ( resolve, reject ) => {
				// Give it more time initially to bootstrap.
				let timerId = setTimeout( checkWaitUntil, 3000 );

				const compilerOptions = {
					watch: options.watch,
					packages: options.packages,
					ignoreDuplicates: options.ignoreDuplicates,
					verbosity: 'warning',

					formats: {
						esnext: options.sourcePath
					},

					onChange() {
						waitUntil = new Date().getTime() + 500;
					}
				};

				log.info( 'Compiling the editor...' );

				compiler.tasks.compile( compilerOptions )
					.then( () => {
						log.info( 'Finished the compilation.' );
					} )
					.catch( ( error ) => {
						clearTimeout( timerId );
						reject( error );
					} );

				// Wait until compiler ends its job and start Karma.
				function checkWaitUntil() {
					if ( new Date() < waitUntil ) {
						timerId = setTimeout( checkWaitUntil, 200 );

						return;
					}

					tasks.automated.runTests( options )
						.then( resolve )
						.catch( ( err ) => {
							log.error( err.message );

							reject( err );
						} );
				}
			} );
		}
	},

	manual: {
		/**
		 * Compile scripts for manual tests.
		 *
		 * @param {String} sourcePath Base path that will be used to resolve all patterns.
		 * @param {String} outputPath Base path where all files will be saved.
		 * @returns {Promise}
		 */
		compileScripts( sourcePath, outputPath ) {
			// Prepare configuration for Webpack.
			const webpackConfig = utils._getWebpackConfig( {
				sourcePath,
				coverage: false,
				sourceMap: false,
				files: []
			} );

			// Watch the files by Webpack.
			webpackConfig.watch = true;

			// Attach NotifierPlugin.
			webpackConfig.plugins.push( new NotifierPlugin() );

			// Generate entry points for Webpack.
			webpackConfig.entry = utils._getWebpackEntriesForManualTests( sourcePath );

			// Set the output point.
			webpackConfig.output = {
				path: outputPath,
				filename: '[name]'
			};

			return new Promise( ( resolve, reject ) => {
				webpack( webpackConfig, ( err ) => {
					if ( err ) {
						return reject( err );
					}

					resolve();
				} );
			} );
		},

		/**
		 * Concat views and descriptions of the manual tests into a single files.
		 *
		 * @param {String} sourcePath Base path that will be used to resolve all patterns.
		 * @param {String} outputPath Base path where all files will be saved.
		 */
		compileViews( sourcePath, outputPath ) {
			const viewTemplate = fs.readFileSync( path.join( __dirname, 'template.html' ), 'utf-8' );

			utils._getManualTestPaths( sourcePath )
				.map( ( testPath ) => testPath.replace( /\.js$/, '' ) )
				.forEach( ( testPath ) => {
					const htmlPath = path.join( sourcePath, `${ testPath }.html` );
					const mdPath = path.join( sourcePath, `${ testPath }.md` );

					// Attach watchers.
					utils._watchFiles( [ htmlPath, mdPath ], ( file ) => {
						utils._compileView( sourcePath, outputPath, file, viewTemplate );
					} );

					// Initial compilation.
					utils._compileView( sourcePath, outputPath, htmlPath, viewTemplate );
				} );
		},

		/**
		 * @param {Object} options
		 * @param {String} options.destinationPath Base path where all files will be saved.
		 * @param {Array.<String>} options.packages Paths to CKEditor 5 dependencies.
		 * @param {Function} done Inform the task runner about finishing the job.
		 */
		run( options, done ) {
			const log = logger();
			const manualTestsPath = path.join( options.destinationPath, 'manual-tests' );
			let timerId = setTimeout( checkWaitUntil, 3000 );
			let waitUntil, httpServer;

			const compilerOptions = {
				watch: true,
				ignoreDuplicates: true,
				packages: options.packages,
				verbosity: 'warning',

				formats: {
					esnext: options.destinationPath
				},

				onChange() {
					waitUntil = new Date().getTime() + 500;
				}
			};

			log.info( 'Compiling the editor...' );

			compiler.tasks.compile( compilerOptions )
				.catch( ( err ) => {
					clearTimeout( timerId );
					done( err );
				} );

			// Wait until compiler ends its job and compile manual tests..
			function checkWaitUntil() {
				if ( new Date() < waitUntil ) {
					timerId = setTimeout( checkWaitUntil, 200 );

					return;
				}

				// Concat the manual test files into single.
				tasks.manual.compileViews( options.destinationPath, manualTestsPath );

				// Compile the scripts - run Webpack.
				tasks.manual.compileScripts( options.destinationPath, manualTestsPath )
					.then( () => {
						// Start the server.
						httpServer = require( './server' )( options.destinationPath, manualTestsPath );

						log.info( 'Ready to test.' );
					} );
			}

			// SIGINT isn't caught on Windows in process. However CTRL+C can be catch
			// by `readline` module. After that we can emit SIGINT to the process manually.
			if ( utils._getPlatform() === 'win32' ) {
				const readline = require( 'readline' ).createInterface( {
					input: process.stdin,
					output: process.stdout
				} );

				readline.on( 'SIGINT', () => {
					process.emit( 'SIGINT' );
				} );
			}

			process.on( 'SIGINT', () => {
				if ( httpServer ) {
					httpServer.close();
				}

				done();
				process.exit();
			} );
		},
	}
};

module.exports = tasks;
