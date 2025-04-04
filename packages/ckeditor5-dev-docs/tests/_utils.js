/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * Replaces Windows style paths to Unix.
 *
 * @param value
 * @returns {string}
 */
function normalizePath( ...value ) {
	return value.join( '/' ).replace( /\\/g, '/' );
}

/**
 * Returns the source file path with line number from a reflection.
 *
 * @param {import('typedoc').Reflection} reflection
 * @returns {string}
 */
function getSource( reflection ) {
	if ( reflection.sources ) {
		const { fileName, line } = reflection.sources[ 0 ];

		return `${ fileName }:${ line }`;
	}

	return getSource( reflection.parent );
}

export default {
	normalizePath,
	getSource
};
