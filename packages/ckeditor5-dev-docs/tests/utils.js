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

/**
 * Returns the source file path with line number from a reflection.
 *
 * @param {require('typedoc').Reflection} reflection
 * @returns {String}
 */
function getSource( reflection ) {
	if ( reflection.sources ) {
		const { fileName, line } = reflection.sources[ 0 ];

		return `${ fileName }:${ line }`;
	}

	return getSource( reflection.parent );
}

module.exports = {
	normalizePath,
	getSource
};
