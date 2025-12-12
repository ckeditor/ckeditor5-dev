/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { createRequire } from 'node:module';

/**
 * Wrapper around `require.resolve()` to allow mocking it in tests.
 */
export function resolvePath( path, options ) {
	const require = createRequire( import.meta.url );

	return require.resolve( path, options );
}
