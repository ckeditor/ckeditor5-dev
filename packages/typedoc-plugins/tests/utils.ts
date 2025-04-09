/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import * as upath from 'upath';

export const ROOT_DIRECTORY = upath.join( __dirname, '..' );
export const ROOT_TEST_DIRECTORY = upath.join( ROOT_DIRECTORY, 'tests' );

/**
 * Replaces Windows style paths to Unix.
 */
export function normalizePath( ...value: Array<string> ): string {
	return value.join( '/' ).replace( /\\/g, '/' );
}
