/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );

/**
 * Checks if the provided version for the package exists in the npm registry.
 *
 * Returns a promise that resolves if version does not exist or rejects the promise otherwise.
 *
 * @param {String} version
 * @param {String} packageName
 * @returns {Promise}
 */
module.exports = async function checkVersionAvailability( version, packageName ) {
	return tools.shExec( `npm show ${ packageName }@${ version } version`, { verbosity: 'silent', async: true } )
		.then( result => {
			// Explicit check for npm < 8.13.0, which does not return anything and it exits with a zero status code when the version for the
			// provided package does not exist in the npm registry.
			if ( !result ) {
				return;
			}

			throw new Error( `The "${ packageName }@${ version }" already exists in npm.` );
		} )
		.catch( error => {
			if ( !error.toString().includes( 'npm ERR! code E404' ) ) {
				throw error;
			}
		} );
};
