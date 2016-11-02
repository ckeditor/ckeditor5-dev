/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const KarmaServer = require( 'karma' ).Server;
const Undertaker = require( 'undertaker' );
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
	 * @param {Array.<String>} options.paths Specify path(s) to tests.
	 * @returns {Promise}
	 */
	runTests( options ) {
		return new Promise( ( resolve ) => {
			const config = utils.getKarmaConfig( options );

			const server = new KarmaServer( config, resolve );

			if ( options.coverage ) {
				const coveragePath = path.join( options.sourcePath, utils.coverageDirectory );

				server.on( 'run_complete', () => {
					gutil.log( `Coverage report saved in '${ gutil.colors.cyan( coveragePath ) }'.` );
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
	 * @param {Array.<String>} options.paths Specify path(s) to tests.
	 * @returns {Promise}
	 */
	test( options ) {
		return new Promise( ( resolve, reject ) => {
			const taker = new Undertaker();

			options.sourcePath = path.resolve( './.build/' );

			taker.task( 'compile', () => {
				const compiler = require( '@ckeditor/ckeditor5-dev-compiler' );

				return compiler.tasks.compile( {
					packages: options.packages,
					formats: {
						esnext: options.sourcePath
					}
				} );
			} );

			taker.task( 'runTests', () => {
				return tasks.runTests( options );
			} );

			taker.on( 'error', ( error ) => {
				reject( error.error );
			} );

			taker.series( 'compile', 'runTests', resolve )();
		} );
	}
};

module.exports = tasks;
