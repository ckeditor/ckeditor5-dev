/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import chalk from 'chalk';
import fs from 'fs-extra';
import upath from 'upath';
import { logInfo } from './loginfo.js';
import type { ChangesetPathsWithGithubUrl } from '../types.js';
import { CHANGESET_DIRECTORY, PRE_RELEASE_DIRECTORY } from './constants.js';

/**
 * Moves changelog entry files to cycle-specific directories instead of deleting them.
 * This preserves the history of changes across prerelease cycles.
 * Returns an array of entry paths that were modified by the move operation
 */
export async function moveChangelogEntryFiles(
	entryPaths: Array<ChangesetPathsWithGithubUrl>
): Promise<Array<ChangesetPathsWithGithubUrl>> {
	const targetDir = PRE_RELEASE_DIRECTORY;
	const modifiedEntryPaths: Array<ChangesetPathsWithGithubUrl> = [];

	logInfo( `○ ${ chalk.cyan( `Moving changelog entries to ${ targetDir }/ directory...` ) }` );

	for ( const repo of entryPaths ) {
		const { cwd, filePaths } = repo;
		const changelogDir = upath.join( cwd, CHANGESET_DIRECTORY );
		const targetPath = upath.join( changelogDir, targetDir );

		await fs.ensureDir( targetPath );

		const modifiedFilePaths: Array<string> = [];

		for ( const filePath of filePaths ) {
			const fileName = upath.basename( filePath );
			const targetFilePath = upath.join( targetPath, fileName );

			await fs.rename( filePath, targetFilePath );

			modifiedFilePaths.push( targetFilePath );
			modifiedFilePaths.push( filePath );
		}

		modifiedEntryPaths.push( {
			...repo,
			filePaths: modifiedFilePaths
		} );
	}

	return modifiedEntryPaths;
}
