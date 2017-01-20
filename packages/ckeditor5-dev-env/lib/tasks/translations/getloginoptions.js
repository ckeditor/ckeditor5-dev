/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const minimist = require( 'minimist' );

module.exports = function getLoginOptions( args ) {
	return minimist( args, {
		string: [ 'password', 'username',' slug', 'name' ],
		alias: {
			p: 'password',
			u: 'username',
			n: 'name',
		}
	} );
};
