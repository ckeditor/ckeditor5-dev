/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { tools } from '@ckeditor/ckeditor5-dev-utils';

/**
 * Checks whether a user is logged to npm as the provided account name.
 *
 * When using npm Trusted Publishing (`useOidc`), the check verifies that the `NPM_ID_TOKEN` environment variable is set
 * instead. npm exchanges the OIDC token only during supported operations, such as `npm publish` or `npm dist-tag`,
 * and `npm whoami` does not reflect Trusted Publishing authentication.
 *
 * @param {string} [npmOwner] Expected npm account name that should be logged into npm. Required unless `useOidc` is enabled.
 * @param {object} [options={}]
 * @param {boolean} [options.useOidc=false] Whether to verify the npm Trusted Publishing (OIDC) setup instead of the npm account.
 * @returns {Promise}
 */
export default async function assertNpmAuthorization( npmOwner, { useOidc = false } = {} ) {
	if ( useOidc ) {
		// On CircleCI, a fresh OIDC token is requested before each npm command (see `getNpmIdToken()`).
		// Elsewhere, only the token presence can be verified upfront.
		if ( !process.env.CIRCLECI && !process.env.NPM_ID_TOKEN ) {
			throw new Error( 'The "NPM_ID_TOKEN" environment variable is required when using npm Trusted Publishing (OIDC).' );
		}

		return;
	}

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
