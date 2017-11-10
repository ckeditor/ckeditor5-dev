/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint node: true, strict: true */

'use strict';

const getKarmaConfig = require( '../utils/automated-tests/getkarmaconfig' );
const KarmaServer = require( 'karma' ).Server;
const path = require( 'path' );
const gutil = require( 'gulp-util' );

module.exports = function runAutomatedTests( options ) {
	return new Promise( ( resolve, reject ) => {
		const config = getKarmaConfig( options );

		if ( !config ) {
			return reject();
		}

		const server = new KarmaServer( config, exitCode => {
			config.removeEntryFile();

			if ( exitCode === 0 ) {
				resolve();
			} else {
				reject();

				process.exit( exitCode );
			}
		} );

		if ( options.coverage ) {
			const coveragePath = path.join( process.cwd(), 'coverage' );

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
};
