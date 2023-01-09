/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/**
 * Replaces Windows style paths to Unix.
 *
 * @param value
 * @returns {String}
 */
function normalizePath( ...value ) {
	return value.join( '/' ).replace( /\\/g, '/' );
}

module.exports = {
	normalizePath
};
