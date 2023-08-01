/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );

/**
 * Checks if the provided version is not used in npm and there will be no errors when calling publish.
 *
 * @param {String} version
 * @param {String} packageName
 * @returns {Promise}
 */
module.exports = async function checkVersionAvailability( version, packageName ) {
	return tools.shExec( `npm show ${ packageName }@${ version } version`, { verbosity: 'silent', async: true } )
		.then( () => {
			throw new Error( `Provided version ${ version } is already used in npm by ${ packageName }.` );
		} )
		.catch( err => {
			if ( !err.toString().includes( 'is not in this registry' ) ) {
				throw err;
			}
		} );
};
