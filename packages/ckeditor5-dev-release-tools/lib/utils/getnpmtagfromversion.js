/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import semver from 'semver';

/**
 * Returns a version tag from specified `version`.
 *
 * For the official release, returns the "latest" tag. For a non-official release (pre-release),
 * returns the version tag extracted from the passed version.
 *
 * @param {string} version
 * @returns {string}
 */
export default function getNpmTagFromVersion( version ) {
	const [ versionTag ] = semver.prerelease( version ) || [ 'latest' ];

	if ( versionTag.startsWith( 'nightly-next' ) ) {
		return 'nightly-next';
	}

	if ( versionTag.startsWith( 'nightly' ) ) {
		return 'nightly';
	}

	if ( versionTag.startsWith( 'internal' ) ) {
		return 'internal';
	}

	return versionTag;
}
