/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import chalk from 'chalk';
import semver, { type ReleaseType } from 'semver';
import type { SectionsWithEntries } from '../types.js';
import { provideNewVersionForMonorepository } from './providenewversionformonorepository.js';
import { logInfo } from './loginfo.js';

type NewVersionObj = {
	isInternal: boolean;
	newVersion: string;
};

export type GetNewVersionOptions = {
	sections: SectionsWithEntries;
	currentVersion: string;
	packageName: string;
	nextVersion: string | undefined;
};

/**
 * This function analyzes the changes and suggests the appropriate version bump.
 */
export async function getNewVersion( options: GetNewVersionOptions ): Promise<NewVersionObj> {
	const { sections, currentVersion, packageName, nextVersion } = options;

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

	if ( sections.minor.entries.length || sections.feature.entries.length ) {
		bumpType = 'minor';
	}

	if ( sections.major.entries.length ) {
		bumpType = 'major';
	}

	const areErrorsPresent = !!sections.invalid.entries.length;
	const areWarningsPresent = Object.values( sections ).some( section =>
		section.entries.some( entry => entry.data.validations && entry.data.validations.length > 0 )
	);

	const userProvidedVersion = await provideNewVersionForMonorepository( {
		packageName,
		bumpType,
		version: currentVersion,
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
