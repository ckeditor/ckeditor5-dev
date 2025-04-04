/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import path from 'path';

export const ROOT_DIRECTORY = path.join( __dirname, '..' );
export const ROOT_TEST_DIRECTORY = path.join( ROOT_DIRECTORY, 'tests' );

/**
 * Replaces Windows style paths to Unix.
 */
export function normalizePath( ...value: Array<string> ): string {
	return value.join( '/' ).replace( /\\/g, '/' );
}
