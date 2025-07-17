/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import semver from 'semver';
import { type ReleaseChannel } from '../types.js';

/**
 * Detects the release channel from a version string.
 */
export function detectReleaseChannel( version: string ): ReleaseChannel {
	const prerelease = semver.prerelease( version );

	if ( !prerelease ) {
		return 'latest';
	}

	const [ channel ] = prerelease as [ string ];

	if ( channel.startsWith( 'beta' ) ) {
		return 'beta';
	}

	if ( channel.startsWith( 'rc' ) ) {
		return 'rc';
	}

	return 'alpha';
}
