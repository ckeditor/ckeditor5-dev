/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import chalk from 'chalk';
import fs from 'fs-extra';
import { logInfo } from './loginfo.js';
import type { ChangesetPathsWithGithubUrl } from '../types.js';

/**
 * Cleans up the input files that have been incorporated into the changelog by deleting them
 * and removing any resulting empty directories both in the current repository and in any external repositories.
 */
export async function removeChangelogEntryFiles( entryPaths: Array<ChangesetPathsWithGithubUrl> ): Promise<void> {
	logInfo( `○ ${ chalk.cyan( 'Removing the changeset files...' ) }` );

	await Promise.all(
		entryPaths
			.flatMap( repo => repo.filePaths )
			.map( file => fs.unlink( file ) )
	);
}
