/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* global setTimeout, clearTimeout */

'use strict';

const path = require( 'path' );
const KarmaServer = require( 'karma' ).Server;
const gutil = require( 'gulp-util' );
const utils = require( './utils' );

const tasks = {
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
			const config = utils.getKarmaConfig( options );

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
		const compiler = require( '@ckeditor/ckeditor5-dev-compiler' );
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

				tasks.runTests( options )
					.then( resolve )
					.catch( ( err ) => {
						log.error( err.message );

						reject( err );
					} );
			}
		} );
	}
};

module.exports = tasks;
