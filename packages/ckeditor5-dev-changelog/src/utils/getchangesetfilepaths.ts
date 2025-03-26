/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs/promises';
import upath from 'upath';
import type { RepositoryConfig } from '../types.js';

/**
 * Gets all changeset file paths from the specified directories.
 *
 * @param cwd - Current working directory
 * @param changesetsDirectory - Directory containing changeset files
 * @param externalRepositories - Array of external repository configurations
 * @returns Array of changeset file paths
 * @throws {Error} If there's an error reading the directories
 */
export async function getChangesetFilePaths(
	cwd: string,
	changesetsDirectory: string,
	externalRepositories: Array<RepositoryConfig>
): Promise<Array<string>> {
	const paths = await Promise.all( [
		getLocalChangesetPaths( cwd, changesetsDirectory ),
		...externalRepositories.map( repo => getExternalChangesetPaths( repo, changesetsDirectory ) )
	] );

	return paths.flat();
}

/**
 * Gets changeset file paths from the local repository.
 *
 * @param cwd - Current working directory
 * @param changesetsDirectory - Directory containing changeset files
 * @returns Array of changeset file paths
 * @throws {Error} If there's an error reading the directory
 */
async function getLocalChangesetPaths( cwd: string, changesetsDirectory: string ): Promise<Array<string>> {
	const changesetDir = upath.join( cwd, changesetsDirectory );
	return getChangesetFilesFromDirectory( changesetDir );
}

/**
 * Gets changeset file paths from an external repository.
 *
 * @param repo - External repository configuration
 * @param changesetsDirectory - Directory containing changeset files
 * @returns Array of changeset file paths
 * @throws {Error} If there's an error reading the directory
 */
async function getExternalChangesetPaths( repo: RepositoryConfig, changesetsDirectory: string ): Promise<Array<string>> {
	const changesetDir = upath.join( repo.cwd, changesetsDirectory );
	return getChangesetFilesFromDirectory( changesetDir );
}

/**
 * Gets all changeset files from a directory.
 *
 * @param directory - Directory to search for changeset files
 * @returns Array of changeset file paths
 * @throws {Error} If there's an error reading the directory
 */
async function getChangesetFilesFromDirectory( directory: string ): Promise<Array<string>> {
	try {
		const entries = await fs.readdir( directory, { withFileTypes: true } );
		return entries
			.filter( entry => entry.isFile() && entry.name.endsWith( '.md' ) )
			.map( entry => upath.join( directory, entry.name ) );
	} catch ( error ) {
		if ( error instanceof Error && error.message.includes( 'ENOENT' ) ) {
			return [];
		}
		throw new Error( `Could not read changeset directory ${ directory }: ${ error instanceof Error ? error.message : String( error ) }` );
	}
}
