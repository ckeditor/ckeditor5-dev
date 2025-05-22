/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import semver from 'semver';

/**
 * Validates if the provided version is higher than the current one.
 */
export function validateVersionHigherThanCurrent( version: string, currentVersion: string ): string | true {
	// Skip this validation for an 'internal' version
	if ( version === 'internal' ) {
		return true;
	}

	if ( !semver.gt( version, currentVersion ) ) {
		return `Provided version must be higher than "${ currentVersion }".`;
	}

	return true;
}
