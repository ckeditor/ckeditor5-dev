/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { type ChangelogReleaseType } from '../types.js';
import semver from 'semver';

export function getReleaseTypeFromVersion( version: string ): ChangelogReleaseType {
	const prerelease = semver.prerelease( version );

	if ( !prerelease ) {
		return 'latest';
	}

	return 'prerelease';
}
