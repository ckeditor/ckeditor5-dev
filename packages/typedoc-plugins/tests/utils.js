/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );

const ROOT_DIRECTORY = path.join( __dirname, '..' );
const ROOT_TEST_DIRECTORY = path.join( ROOT_DIRECTORY, 'tests' );

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
	normalizePath,
	ROOT_DIRECTORY: normalizePath( ROOT_DIRECTORY ),
	ROOT_TEST_DIRECTORY: normalizePath( ROOT_TEST_DIRECTORY )
};
