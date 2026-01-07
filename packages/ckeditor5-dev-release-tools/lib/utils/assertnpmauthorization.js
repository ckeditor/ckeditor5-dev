/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { tools } from '@ckeditor/ckeditor5-dev-utils';

/**
 * Checks whether a user is logged to npm as the provided account name.
 *
 * @param {string} npmOwner Expected npm account name that should be logged into npm.
 * @returns {Promise}
 */
export default async function assertNpmAuthorization( npmOwner ) {
	return tools.shExec( 'npm whoami', { verbosity: 'error', async: true } )
		.then( npmCurrentUser => {
			if ( npmOwner !== npmCurrentUser.trim() ) {
				return Promise.reject();
			}
		} )
		.catch( () => {
			throw new Error( `You must be logged to npm as "${ npmOwner }" to execute this release step.` );
		} );
}
