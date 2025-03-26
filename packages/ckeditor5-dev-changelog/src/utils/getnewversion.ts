/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import chalk from 'chalk';
import { ReleaseType } from 'semver';
import type { SectionsWithEntries } from '../types.js';
import { provideNewVersionForMonoRepository } from './providenewversionformonorepository.js';
import { logInfo } from './loginfo.js';

export async function getNewVersion( sectionsWithEntries: SectionsWithEntries, oldVersion: string, packageName: string ): Promise<string> {
	logInfo( `📍 ${ chalk.cyan( 'Determining the new version...' ) }\n` );

	let bumpType: ReleaseType = 'patch';

	if ( sectionsWithEntries.minor.entries.length || sectionsWithEntries.Feature.entries.length ) {
		bumpType = 'minor';
	}

	if ( sectionsWithEntries.major.entries.length ) {
		bumpType = 'major';
	}

	return await provideNewVersionForMonoRepository( { version: oldVersion, packageName, bumpType } );
}
