/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { workspaces } from '@ckeditor/ckeditor5-dev-utils';
import { glob } from 'glob';
import upath from 'upath';
import type { ChangesetPathsWithGithubUrl, RepositoryConfig } from '../types.js';
import { CHANGESET_DIRECTORY } from './constants.js';
import { AsyncArray } from './asyncarray.js';

type GetChangesetFilePathsOptions = {
	cwd: string;
	externalRepositories: Array<RepositoryConfig>;
	shouldSkipLinks: boolean;
};

/**
 * This function collects markdown files that contain changelog entries for processing.
 */
export async function getChangesetFilePaths( options: GetChangesetFilePathsOptions ): Promise<Array<ChangesetPathsWithGithubUrl>> {
	const { cwd, externalRepositories, shouldSkipLinks } = options;

	return await AsyncArray
		.from( Promise.resolve( externalRepositories ) )
		.map( async repo => {
			const changesetGlob = await glob( '**/*.md', {
				cwd: upath.join( repo.cwd, CHANGESET_DIRECTORY ),
				absolute: true
			} );

			return {
				changesetPaths: changesetGlob.map( p => upath.normalize( p ) ),
				gitHubUrl: await workspaces.getRepositoryUrl( repo.cwd, { async: true } ),
				shouldSkipLinks: !!repo.shouldSkipLinks,
				cwd: repo.cwd,
				isRoot: false
			};
		} )
		.then( async externalResults => {
			const mainChangesetGlob = await glob( '**/*.md', {
				cwd: upath.join( cwd, CHANGESET_DIRECTORY ),
				absolute: true
			} );

			const mainEntry = {
				changesetPaths: mainChangesetGlob.map( p => upath.normalize( p ) ),
				gitHubUrl: await workspaces.getRepositoryUrl( cwd, { async: true } ),
				shouldSkipLinks,
				cwd,
				isRoot: true
			};

			return [ mainEntry, ...externalResults ];
		} );
}
