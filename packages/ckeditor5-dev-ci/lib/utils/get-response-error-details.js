/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const MAX_DETAILS_LENGTH = 300;

/**
 * Extracts a human-readable error message from a failed CircleCI API response.
 *
 * It returns the `message` or `error` field from a JSON body if either is a string.
 * Otherwise, it returns the raw body truncated to a few hundred characters, so a full HTML
 * error page from a proxy does not flood the logs. It returns `null` when the body is empty
 * or cannot be read.
 *
 * @param {Response} response
 * @returns {Promise<string|null>}
 */
export default async function getResponseErrorDetails( response ) {
	const body = await response.text()
		.then( text => text.trim() )
		.catch( () => '' );

	if ( !body ) {
		return null;
	}

	try {
		const data = JSON.parse( body );

		if ( data && typeof data.message === 'string' ) {
			return data.message;
		}

		if ( data && typeof data.error === 'string' ) {
			return data.error;
		}
	} catch {
		// Not a JSON body. Fall back to the raw text below.
	}

	if ( body.length > MAX_DETAILS_LENGTH ) {
		return body.slice( 0, MAX_DETAILS_LENGTH ) + '…';
	}

	return body;
}
