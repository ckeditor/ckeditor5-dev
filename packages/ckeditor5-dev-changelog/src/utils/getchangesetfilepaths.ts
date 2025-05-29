/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { workspaces } from '@ckeditor/ckeditor5-dev-utils';
import { glob } from 'glob';
import upath from 'upath';
import type { ChangesetPathsWithGithubUrl, RepositoryConfig } from '../types.js';
import { CHANGESET_DIRECTORY } from '../constants';

/**
 * This function collects markdown files that contain changelog entries for processing.
 */
export async function getChangesetFilePaths(
	cwd: string,
	externalRepositories: Array<Required<RepositoryConfig>>,
	skipLinks: boolean
): Promise<Array<ChangesetPathsWithGithubUrl>> {
	const externalChangesetPaths = await Promise.all( externalRepositories.map( async repo => {
		const changesetGlob = await glob( '**/*.md', { cwd: upath.join( repo.cwd, CHANGESET_DIRECTORY ), absolute: true } );

		return {
			changesetPaths: changesetGlob.map( path => upath.normalize( path ) ),
			gitHubUrl: await workspaces.getRepositoryUrl( repo.cwd, { async: true } ),
			skipLinks: repo.shouldSkipLinks,
			cwd: repo.cwd,
			isRoot: false
		};
	} ) );

	const mainChangesetGlob = await glob( '**/*.md', { cwd: upath.join( cwd, CHANGESET_DIRECTORY ), absolute: true } );

	const resolvedChangesetPaths = await Promise.all( [
		{
			changesetPaths: mainChangesetGlob.map( path => upath.normalize( path ) ),
			gitHubUrl: await workspaces.getRepositoryUrl( cwd, { async: true } ),
			skipLinks,
			cwd,
			isRoot: true
		},
		...externalChangesetPaths
	] );

	return resolvedChangesetPaths;
}
