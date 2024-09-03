/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { tools } from '@ckeditor/ckeditor5-dev-utils';
import shellEscape from 'shell-escape';

/**
 * Checks if the provided version for the package exists in the npm registry.
 *
 * Returns a promise that resolves to `true` if the provided version does not exist or resolves the promise to `false` otherwise.
 * If the `npm show` command exits with an error, it is re-thrown.
 *
 * @param {String} version
 * @param {String} packageName
 * @returns {Promise}
 */
export async function checkVersionAvailability( version, packageName ) {
	const command = `npm show ${ shellEscape( [ packageName ] ) }@${ shellEscape( [ version ] ) } version`;

	return tools.shExec( command, { verbosity: 'silent', async: true } )
		.then( result => {
			// Explicit check for npm < 8.13.0, which does not return anything (an empty result) and it exits with a zero status code when
			// the version for the provided package does not exist in the npm registry.
			if ( !result ) {
				return true;
			}

			// Provided version exists in the npm registry.
			return false;
		} )
		.catch( error => {
			// All errors except the "E404" are re-thrown.
			if ( !error.toString().includes( 'code E404' ) ) {
				throw error;
			}

			// Npm >= 8.13.0 throws an "E404" error if a version does not exist.
			// Npm < 8.13.0 should never reach this line.
			return true;
		} );
}
