/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { manifest } from './pacotecacheless.js';

/**
 * Checks if a specific version of a package is available in the npm registry.
 */
export default async function checkVersionAvailability( version: string, packageName: string ): Promise<boolean> {
	return manifest( `${ packageName }@${ version }` )
		.then( () => {
			// If `manifest` resolves, a package with the given version exists.
			return false;
		} )
		.catch( () => {
			// When throws, the package does not exist.
			return true;
		} );
}
