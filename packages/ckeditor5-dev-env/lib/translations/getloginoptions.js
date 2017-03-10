/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const minimist = require( 'minimist' );

/**
 * Retuns username and password from the array of command line arguments.
 *
 * @param {Array.<String>} args
 * @returns {Object}
 */
module.exports = function getLoginOptions( args ) {
	return minimist( args, {
		string: [ 'username', 'password' ],
		alias: {
			u: 'username',
			p: 'password'
		}
	} );
};
