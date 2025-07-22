/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { type ChangelogReleaseType } from '../types.js';
import semver from 'semver';

export function getReleaseTypeFromVersion( currentVersion: string, nextVersion: string ): ChangelogReleaseType {
	const currentVersionPrerelease = semver.prerelease( currentVersion );
	const nextVersionPrerelease = semver.prerelease( nextVersion );

	if ( !nextVersionPrerelease ) {
		return 'latest';
	}

	if ( nextVersionPrerelease[ 0 ] === currentVersionPrerelease?.[ 0 ] ) {
		return 'prerelease';
	}

	return 'prerelease-promote';
}
