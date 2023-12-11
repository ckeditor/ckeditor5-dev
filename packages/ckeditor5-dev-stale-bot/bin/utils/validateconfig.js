/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * Checks if all required fields in the configuration exist.
 *
 * @param {Config} config Configuration options.
 * @returns {Boolean}
 */
module.exports = function validateConfig( config ) {
	if ( !config.CKE5_GITHUB_TOKEN ) {
		throw new Error( 'Missing configuration option: CKE5_GITHUB_TOKEN' );
	}

	if ( !config.REPOSITORY_SLUG ) {
		throw new Error( 'Missing configuration option: REPOSITORY_SLUG' );
	}

	if ( !config.STALE_LABELS ) {
		throw new Error( 'Missing configuration option: STALE_LABELS' );
	}

	if ( !config.STALE_ISSUE_MESSAGE ) {
		throw new Error( 'Missing configuration option: STALE_ISSUE_MESSAGE' );
	}

	if ( !config.STALE_PR_MESSAGE ) {
		throw new Error( 'Missing configuration option: STALE_PR_MESSAGE' );
	}
};
