/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import chalk from 'chalk';
import type { ReleaseType } from 'semver';
import type { SectionsWithEntries } from '../types.js';
import { provideNewVersionForMonorepository } from './providenewversionformonorepository.js';
import { logInfo } from './loginfo.js';

/**
 * Determines the next version number based on the changes and current version.
 * This function analyzes the changes and suggests the appropriate version bump.
 */
export async function getNewVersion( sectionsWithEntries: SectionsWithEntries, oldVersion: string, packageName: string ): Promise<string> {
	logInfo( `📍 ${ chalk.cyan( 'Determining the new version...' ) }\n` );

	let bumpType: ReleaseType = 'patch';

	if ( sectionsWithEntries.minor.entries.length || sectionsWithEntries.Feature.entries.length ) {
		bumpType = 'minor';
	}

	if ( sectionsWithEntries.major.entries.length ) {
		bumpType = 'major';
	}

	return await provideNewVersionForMonorepository( { version: oldVersion, packageName, bumpType } );
}
