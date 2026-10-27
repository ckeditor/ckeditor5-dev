/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { manifest } from './pacotecacheless.js';

/**
 * Error codes meaning that the registry answered and the version does not exist:
 * `ETARGET` when the package exists but has no such version, `E404` when the package does not exist.
 */
const NOT_FOUND_ERROR_CODES = [ 'ETARGET', 'E404' ];

/**
 * Checks if a specific version of a package is available in the npm registry.
 *
 * Any other error (for example, the registry cannot be reached) is rethrown, because it does not tell
 * whether the version exists.
 */
export default async function checkVersionAvailability( version: string, packageName: string ): Promise<boolean> {
	return manifest( `${ packageName }@${ version }` )
		.then( () => {
			// If `manifest` resolves, a package with the given version exists.
			return false;
		} )
		.catch( ( error: { code?: string } ) => {
			if ( NOT_FOUND_ERROR_CODES.includes( error?.code as string ) ) {
				return true;
			}

			throw error;
		} );
}
