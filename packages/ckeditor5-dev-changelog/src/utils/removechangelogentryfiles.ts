/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import chalk from 'chalk';
import upath from 'upath';
import { rm, readdir } from 'fs/promises';
import { logInfo } from './loginfo.js';
import type { ChangesetPathsWithGithubUrl } from '../types.js';
import { CHANGESET_DIRECTORY } from './constants.js';

/**
 * Cleans up the input files that have been incorporated into the changelog by deleting them
 * and removing any resulting empty directories both in the current repository and in any external repositories.
 */
export async function removeChangelogEntryFiles( entryPaths: Array<ChangesetPathsWithGithubUrl> ): Promise<void> {
	logInfo( `○ ${ chalk.cyan( 'Removing the changeset files...' ) }` );

	for ( const repo of entryPaths ) {
		const changesetDirectory = upath.join( repo.cwd, CHANGESET_DIRECTORY );
		const entries = await readdir( changesetDirectory, { withFileTypes: true } );

		for ( const entry of entries ) {
			if ( entry.name === '.gitkeep' ) {
				continue;
			}

			await rm( upath.join( changesetDirectory, entry.name ), { recursive: true, force: true } );
		}
	}
}
