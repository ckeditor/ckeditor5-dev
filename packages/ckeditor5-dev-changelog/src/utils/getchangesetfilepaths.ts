/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { glob } from 'glob';
import upath from 'upath';
import type { ChangesetPathsWithGithubUrl, RepositoryConfig } from '../types.js';
import { getRepositoryUrl } from '../utils/external/getrepositoryurl.js';

/**
 * This function collects markdown files that contain changelog entries for processing.
 */
export async function getChangesetFilePaths(
	cwd: string,
	changesetsDirectory: string,
	externalRepositories: Array<Required<RepositoryConfig>>
): Promise<Array<ChangesetPathsWithGithubUrl>> {
	const externalChangesetPaths = await Promise.all( externalRepositories.map( async repo => ( {
		changesetPaths: await glob( '**/*.md', { cwd: upath.join( repo.cwd, changesetsDirectory ), absolute: true } ),
		gitHubUrl: await getRepositoryUrl( repo.cwd ),
		skipLinks: repo.skipLinks
	} ) ) );

	const resolvedChangesetPaths = await Promise.all( [
		{
			changesetPaths: await glob( '**/*.md', { cwd: upath.join( cwd, changesetsDirectory ), absolute: true } ),
			gitHubUrl: await getRepositoryUrl( cwd ),
			skipLinks: false
		},
		...externalChangesetPaths
	] );

	return resolvedChangesetPaths;
}
