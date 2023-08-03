/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );

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
module.exports = async function checkVersionAvailability( version, packageName ) {
	return tools.shExec( `npm show ${ packageName }@${ version } version`, { verbosity: 'silent', async: true } )
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
			if ( !error.toString().includes( 'npm ERR! code E404' ) ) {
				throw error;
			}

			// Npm >= 8.13.0 throws an "E404" error if a version does not exist.
			// Npm < 8.13.0 should never reach this line.
			return true;
		} );
};
