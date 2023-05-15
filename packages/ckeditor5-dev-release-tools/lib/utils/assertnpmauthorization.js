/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );

/**
 * Checks whether a user is logged to npm as the provided account name.
 *
 * @param {String} npmOwner Expected npm account name that should be logged into npm.
 * @returns {Promise}
 */
module.exports = async function assertNpmAuthorization( npmOwner ) {
	return tools.shExec( 'npm whoami', { verbosity: 'error', async: true } )
		.then( npmCurrentUser => {
			if ( npmOwner !== npmCurrentUser.trim() ) {
				return Promise.reject();
			}
		} )
		.catch( () => {
			return Promise.reject( `You must be logged to npm as "${ npmOwner }" to execute this release step.` );
		} );
};
