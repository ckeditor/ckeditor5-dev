/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import chalk from 'chalk';
import semver, { type ReleaseType } from 'semver';
import { provideNewVersion } from './providenewversion.js';
import { logInfo } from './loginfo.js';
import { detectReleaseChannel } from './detectreleasechannel.js';
import type { ChangelogReleaseType, SectionsWithEntries } from '../types.js';

type NextVersionOutput = {
	isInternal: boolean;
	newVersion: string;
};

export type DetermineNextVersionOptions = {
	sections: SectionsWithEntries;
	currentVersion: string;
	packageName: string;
	nextVersion: string | undefined;
	releaseType: ChangelogReleaseType;
};

/**
 * Determines the next version for a single package or a mono-repository setup based on
 * the change sections, * user input, and semantic versioning rules.
 *
 * The function handles:
 * * Automatic version bump calculation from categorized changelog sections (major, minor, patch).
 * * Accepting explicit next version overrides, including a special `internal` version bump.
 * * User prompts for version input when no explicit version is provided.
 */
export async function determineNextVersion( options: DetermineNextVersionOptions ): Promise<NextVersionOutput> {
	const { sections, currentVersion, packageName, nextVersion, releaseType } = options;

	if ( nextVersion === 'internal' ) {
		const internalVersionBump = getInternalVersionBump( currentVersion );

		logInfo( `○ ${ chalk.cyan( `Determined the next version to be ${ internalVersionBump.newVersion }.` ) }` );

		return internalVersionBump;
	}

	if ( nextVersion ) {
		logInfo( `○ ${ chalk.cyan( `Determined the next version to be ${ nextVersion }.` ) }` );

		return { newVersion: nextVersion, isInternal: false };
	}

	logInfo( `○ ${ chalk.cyan( 'Determining the new version...' ) }` );

	let bumpType: ReleaseType = 'patch';

	if ( releaseType === 'prerelease' ) {
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
		version: currentVersion,
		releaseChannel: detectReleaseChannel( currentVersion ),
		displayValidationWarning: areErrorsPresent || areWarningsPresent
	} );

	if ( userProvidedVersion === 'internal' ) {
		return getInternalVersionBump( currentVersion );
	}

	return { newVersion: userProvidedVersion, isInternal: false };
}

function getInternalVersionBump( currentVersion: string ) {
	const version = semver.inc( currentVersion, 'patch' );

	if ( !version ) {
		throw new Error( 'Unable to determine new version based on the version in root package.json.' );
	}

	return { newVersion: version, isInternal: true };
}
