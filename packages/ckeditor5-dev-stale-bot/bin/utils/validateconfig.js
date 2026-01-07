/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const requiredFields = [
	'GITHUB_TOKEN',
	'REPOSITORY_SLUG',
	'STALE_LABELS',
	'CLOSE_ISSUE_LABELS',
	'CLOSE_PR_LABELS',
	'STALE_ISSUE_MESSAGE',
	'STALE_PR_MESSAGE',
	'CLOSE_ISSUE_MESSAGE',
	'CLOSE_PR_MESSAGE'
];

/**
 * Checks if all required fields in the configuration exist.
 *
 * @param {Config} config Configuration options.
 * @returns {void}
 */
export default function validateConfig( config ) {
	const missingFields = requiredFields.filter( fieldName => !config[ fieldName ] );

	if ( !missingFields.length ) {
		return;
	}

	throw new Error( `Missing configuration options: ${ missingFields.join( ', ' ) }.` );
}

