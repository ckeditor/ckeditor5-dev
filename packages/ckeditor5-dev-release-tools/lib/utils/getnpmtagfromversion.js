/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import semver from 'semver';

/**
 * @param {String} version
 * @returns {String}
 */
export default function getNpmTagFromVersion( version ) {
	const [ versionTag ] = semver.prerelease( version ) || [ 'latest' ];

	return versionTag;
}
