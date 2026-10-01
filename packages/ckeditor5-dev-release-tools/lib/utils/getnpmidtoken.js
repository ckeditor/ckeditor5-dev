/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { execFile } from 'node:child_process';

/**
 * The audience that npm expects in an OIDC token used in the npm Trusted Publishing token exchange.
 */
export const NPM_OIDC_AUDIENCE = 'npm:registry.npmjs.org';

/**
 * Returns an OIDC token that the npm CLI exchanges for a short-lived npm token (npm Trusted Publishing).
 *
 * npm accepts a CircleCI OIDC token in the exchange only for a few minutes after it was issued, even though the token
 * itself is valid longer. A release that publishes many packages takes longer than that. Hence, on CircleCI, a fresh
 * token is requested each time, right before an npm command that needs it.
 *
 * Outside CircleCI, the `NPM_ID_TOKEN` environment variable is used, if it is set.
 *
 * @returns {Promise<string>}
 */
export default async function getNpmIdToken() {
	if ( process.env.CIRCLECI ) {
		const stdout = await new Promise( ( resolve, reject ) => {
			const args = [ 'run', 'oidc', 'get', '--claims', JSON.stringify( { aud: NPM_OIDC_AUDIENCE } ) ];

			execFile( 'circleci', args, ( error, output ) => error ? reject( error ) : resolve( output ) );
		} );
		const token = String( stdout ).trim();

		if ( !token ) {
			throw new Error( 'The `circleci run oidc get` command returned an empty OIDC token.' );
		}

		return token;
	}

	if ( process.env.NPM_ID_TOKEN ) {
		return process.env.NPM_ID_TOKEN;
	}

	throw new Error(
		'Cannot get an OIDC token for npm Trusted Publishing (OIDC). ' +
		'Run the command on CircleCI or set the "NPM_ID_TOKEN" environment variable.'
	);
}
