/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { RepositoryConfig } from '../types.js';
import { logInfo } from './loginfo.js';
import chalk from 'chalk';
import fs from 'fs/promises';
import { removeEmptyDirs } from './removeemptydirs.js';
import upath from 'upath';

/**
 * Removes processed changeset files after changelog generation.
 * This function cleans up the changeset files that have been incorporated into the changelog.
 */
export async function removeChangesetFiles(
	changesetFilePaths: Array<string>,
	cwd: string,
	changelogDirectory: string,
	externalRepositories: Array<RepositoryConfig>
): Promise<void> {
	logInfo( `📍 ${ chalk.cyan( 'Removing the changeset files...' ) }\n` );

	await Promise.all( changesetFilePaths.map( file => fs.unlink( file ) ) );

	await removeEmptyDirs( upath.join( cwd, changelogDirectory ) );

	for ( const externalRepo of externalRepositories ) {
		await removeEmptyDirs( upath.join( externalRepo.cwd, changelogDirectory ) );
	}
}
