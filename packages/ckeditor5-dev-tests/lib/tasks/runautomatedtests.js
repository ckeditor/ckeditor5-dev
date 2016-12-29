/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint node: true, strict: true */

'use strict';

const getKarmaConfig = require( '../utils/getkarmaconfig' );
const KarmaServer = require( 'karma' ).Server;

module.exports = function runAutomatedTests( options ) {
	return new Promise( ( resolve, reject ) => {
		const config = getKarmaConfig( options );

		const server = new KarmaServer( config, ( exitCode ) => {
			if ( exitCode === 0 ) {
				resolve();
			} else {
				reject();

				process.exit( exitCode );
			}
		} );

		server.start();
	} );
};
