/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const glob = require( 'glob' );

/**
 * @param {String} pattern
 * @returns {Array.<String>}
 */
module.exports = function globSync( pattern ) {
	// Glob does not understand the backslash in paths on Windows.
	pattern = pattern.replace( '\\', '/' );

	const files = glob.sync( pattern );

	// Glob always returns paths separated by '/'. This is incorrect on Windows.
	if ( process.platform === 'win32' ) {
		return files.map( absolutePath => absolutePath.replace( /\//g, '\\' ) );
	}

	return files;
};
