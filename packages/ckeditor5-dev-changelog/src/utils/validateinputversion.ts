/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import semver from 'semver';
import { npm } from '@ckeditor/ckeditor5-dev-utils';
import type { ChangelogReleaseType } from '../types.js';

type ValidateOptions = {
	newVersion: string;
	version: string;
	releaseType: ChangelogReleaseType;
	packageName: string;
	suggestedVersion: string;
};

export async function validateInputVersion( options: ValidateOptions ): Promise<string | true> {
	const { newVersion, version, releaseType, packageName, suggestedVersion } = options;

	const [ newChannel ] = semver.prerelease( newVersion ) || [ 'latest' ];
	const [ currentChannel ] = semver.prerelease( version ) || [ 'latest' ];

	// Generic semantic‑version checks.
	if ( !semver.valid( newVersion ) ) {
		return 'Please provide a valid version.';
	}

	if ( !semver.gt( newVersion, version ) ) {
		return `Provided version must be higher than "${ version }".`;
	}

	if ( !( await npm.checkVersionAvailability( newVersion, packageName ) ) ) {
		return 'Given version is already taken.';
	}

	// Rules that depend on release type.
	const isPrerelease = releaseType === 'prerelease';
	const isPrereleasePromote = releaseType === 'prerelease-promote';
	const isLatest = releaseType === 'latest';

	// Pre‑release types must always include a channel suffix.
	if ( ( isPrerelease || isPrereleasePromote ) && newChannel === 'latest' ) {
		return 'You chose the "pre-release" release type. Please provide a version with a channel suffix.';
	}

	// Promoting a pre‑release: new version ≥ suggested version.
	if ( isPrereleasePromote && !semver.gte( newVersion, suggestedVersion ) ) {
		return `Provided version must be higher or equal to "${ suggestedVersion }".`;
	}

	// Continuing a pre‑release stream: channel cannot change.
	if (
		isPrerelease &&
		currentChannel !== 'latest' &&
		currentChannel !== newChannel
	) {
		return `Provided channel must be the same existing channel ${ currentChannel }.`;
	}

	// Latest release must not carry a channel suffix.
	if ( isLatest && newChannel !== 'latest' ) {
		return 'You chose the "latest" release type. Please provide a version without a channel suffix.';
	}

	return true;
}
