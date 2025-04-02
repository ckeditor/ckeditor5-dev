/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import chalk from 'chalk';
import semver, { type ReleaseType } from 'semver';
import type { SectionsWithEntries } from '../types.js';
import { provideNewVersionForMonorepository } from './external/providenewversionformonorepository.js';
import { logInfo } from './loginfo.js';

type NewVersionObj = {
	isInternal: boolean;
	newVersion: string;
};

/**
 * This function analyzes the changes and suggests the appropriate version bump.
 */
export async function getNewVersion(
	sectionsWithEntries: SectionsWithEntries,
	oldVersion: string,
	packageName: string,
	nextVersion: string | undefined ): Promise<NewVersionObj>
{
	logInfo( `○ ${ chalk.cyan( 'Determining the new version...' ) }` );

	if ( nextVersion === 'internal' ) {
		return getInternalVersionBump( oldVersion );
	}

	let bumpType: ReleaseType = 'patch';

	if ( sectionsWithEntries.minor.entries.length || sectionsWithEntries.feature.entries.length ) {
		bumpType = 'minor';
	}

	if ( sectionsWithEntries.major.entries.length ) {
		bumpType = 'major';
	}

	const userProvidedVersion = await provideNewVersionForMonorepository( { version: oldVersion, packageName, bumpType } );

	if ( userProvidedVersion === 'internal' ) {
		return getInternalVersionBump( oldVersion );
	}

	return { newVersion: userProvidedVersion, isInternal: false };
}

function getInternalVersionBump( oldVersion: string ) {
	const version = semver.inc( oldVersion, 'patch' );

	if ( !version ) {
		throw new Error( 'Unable to determine new version based on the version in root package.json.' );
	}

	return { newVersion: version, isInternal: true };
}
