/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { manifest } from './pacotecacheless.js';

/**
 * Checks if the provided version for the package exists in the npm registry.
 *
 * Returns a promise that resolves to `true` if the provided version does not exist or resolves the promise to `false` otherwise.
 *
 * @param {string} version
 * @param {string} packageName
 * @returns {Promise}
 */
export default async function checkVersionAvailability( version, packageName ) {
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
