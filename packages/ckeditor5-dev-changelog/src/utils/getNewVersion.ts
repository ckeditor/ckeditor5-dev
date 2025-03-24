/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { SectionsWithEntries } from '../types.js';
import { logInfo } from './logInfo.js';
import chalk from 'chalk';
import { provideNewVersionForMonoRepository } from '@ckeditor/ckeditor5-dev-release-tools';

export async function getNewVersion( sectionsWithEntries: SectionsWithEntries, oldVersion: string ): Promise<string> {
	logInfo( `📍 ${ chalk.cyan( 'Determining the new version...' ) }\n` );

	let bumpType = 'patch';

	if ( sectionsWithEntries.minor.entries || sectionsWithEntries.Feature.entries ) {
		bumpType = 'minor';
	}

	if ( sectionsWithEntries.major.entries ) {
		bumpType = 'major';
	}

	return await provideNewVersionForMonoRepository( { version: oldVersion, packageName: '', bumpType } );
}
