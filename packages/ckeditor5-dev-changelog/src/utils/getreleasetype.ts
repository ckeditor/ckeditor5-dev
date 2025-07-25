/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { type ChangelogReleaseType } from '../types.js';
import semver from 'semver';

export function getReleaseType( currentVersion: string, nextVersion: string ): ChangelogReleaseType {
	const [ currentChannel ] = semver.prerelease( currentVersion ) || [ 'latest' ];
	const [ nextChannel ] = semver.prerelease( nextVersion ) || [ 'latest' ];

	if ( nextChannel === 'latest' ) {
		return 'latest';
	}

	if ( nextChannel === currentChannel ) {
		return 'prerelease';
	}

	return 'prerelease-promote';
}
