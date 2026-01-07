/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { styleText } from 'node:util';
import { type ReleaseType } from 'semver';
import { provideNewVersion } from './providenewversion.js';
import { logInfo } from './loginfo.js';
import { detectReleaseChannel } from './detectreleasechannel.js';
import { validateInputVersion } from './validateinputversion.js';
import { InternalError } from './internalerror.js';
import type { ChangelogReleaseType, SectionsWithEntries } from '../types.js';

export type DetermineNextVersionOptions = {
	sections: SectionsWithEntries;
	currentVersion: string;
	packageName: string;
	nextVersion: string | undefined;
	releaseType: ChangelogReleaseType;
};

/**
 * Determines the next version for a single package or a mono-repository setup based on
 * the change sections, user input, and semantic versioning rules.
 *
 * The function handles:
 * * Automatic version bump calculation from categorized changelog sections (major, minor, patch).
 * * Version bump for prerelease channels.
 * * User prompts for version input when no explicit version is provided.
 */
export async function determineNextVersion( options: DetermineNextVersionOptions ): Promise<string> {
	const { sections, currentVersion, packageName, nextVersion, releaseType } = options;

	if ( nextVersion ) {
		logInfo( `○ ${ styleText( 'cyan', `Determined the next version to be ${ nextVersion }.` ) }` );

		const isNightlyVersion = nextVersion.startsWith( '0.0.0-' );

		if ( isNightlyVersion ) {
			return nextVersion;
		}

		const validationResult = await validateInputVersion( {
			newVersion: nextVersion,
			suggestedVersion: nextVersion,
			version: currentVersion,
			releaseType,
			packageName
		} );

		if ( typeof validationResult === 'string' ) {
			throw new InternalError( validationResult );
		}

		return nextVersion;
	}

	logInfo( `○ ${ styleText( 'cyan', 'Determining the new version...' ) }` );

	let bumpType: ReleaseType = 'patch';

	if ( releaseType === 'prerelease' || releaseType === 'prerelease-promote' ) {
		bumpType = 'prerelease';
	} else if ( sections.major.entries.length || sections.breaking.entries.length ) {
		bumpType = 'major';
	} else if ( sections.minor.entries.length || sections.feature.entries.length ) {
		bumpType = 'minor';
	}

	const areErrorsPresent = !!sections.invalid.entries.length;
	const areWarningsPresent = Object.values( sections ).some( section =>
		section.entries.some( entry => entry.data.validations && entry.data.validations.length > 0 )
	);

	const userProvidedVersion = await provideNewVersion( {
		packageName,
		bumpType,
		releaseType,
		version: currentVersion,
		releaseChannel: detectReleaseChannel( currentVersion, releaseType === 'prerelease-promote' ),
		displayValidationWarning: areErrorsPresent || areWarningsPresent
	} );

	return userProvidedVersion;
}
