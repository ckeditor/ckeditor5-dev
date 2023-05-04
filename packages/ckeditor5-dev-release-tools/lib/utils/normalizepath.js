/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/**
 * Normalizes the provided path by removing leading and trailing path separators and converting all backslashes to slashes.
 *
 * @param {String} path Path to normalize.
 * @returns {String}
 */
module.exports = function normalizePath( path ) {
	return path
		.split( /[/\\]/ )
		.filter( Boolean )
		.join( '/' );
};
