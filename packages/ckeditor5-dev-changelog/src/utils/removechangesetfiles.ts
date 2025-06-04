/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import chalk from 'chalk';
import fs from 'fs-extra';
import upath from 'upath';
import { removeEmptyDirs } from './removeemptydirs.js';
import type { ChangesetPathsWithGithubUrl, RepositoryConfig } from '../types.js';
import { logInfo } from './loginfo.js';
import { CHANGESET_DIRECTORY } from './constants.js';

type RemoveChangesetFilesOptions = {
	changesetFilePaths: Array<ChangesetPathsWithGithubUrl>;
	cwd: string;
	externalRepositories: Array<RepositoryConfig>;
};

/**
 * This function cleans up the changeset files that have been incorporated into the changelog.
 */
export async function removeChangesetFiles( options: RemoveChangesetFilesOptions ): Promise<void> {
	const { changesetFilePaths, cwd, externalRepositories } = options;

	logInfo( `○ ${ chalk.cyan( 'Removing the changeset files...' ) }` );

	await Promise.all( changesetFilePaths.flatMap( repo => repo.changesetPaths ).map( file => fs.unlink( file ) ) );

	await removeEmptyDirs( upath.join( cwd, CHANGESET_DIRECTORY ) );

	for ( const externalRepo of externalRepositories ) {
		await removeEmptyDirs( upath.join( externalRepo.cwd, CHANGESET_DIRECTORY ) );
	}
}
