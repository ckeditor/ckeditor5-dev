/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { workspaces } from '@ckeditor/ckeditor5-dev-utils';
import { glob } from 'tinyglobby';
import upath from 'upath';
import { CHANGESET_DIRECTORY } from './constants.js';
import { AsyncArray } from './asyncarray.js';
import type { ChangesetPathsWithGithubUrl, LinkFilter, RepositoryConfig } from '../types.js';

type FindChangelogEntryPathsOptions = {
	cwd: string;
	externalRepositories: Array<RepositoryConfig>;
	linkFilter?: LinkFilter;
	shouldSkipLinks?: boolean;
	includeSubdirectories?: boolean;
};

/**
 * Gathers changelog entry file paths (Markdown files) from the main repository and any configured external repositories.
 */
export async function findChangelogEntryPaths( options: FindChangelogEntryPathsOptions ): Promise<Array<ChangesetPathsWithGithubUrl>> {
	const { cwd, externalRepositories, includeSubdirectories = true } = options;
	const globPattern = includeSubdirectories ? '**/*.md' : '*.md';

	return AsyncArray
		.from( Promise.resolve( externalRepositories ) )
		.map( async repo => {
			const changesetGlob = await glob( globPattern, {
				cwd: upath.join( repo.cwd, CHANGESET_DIRECTORY ),
				absolute: true
			} );

			return {
				filePaths: changesetGlob.map( p => upath.normalize( p ) ),
				gitHubUrl: await workspaces.getRepositoryUrl( repo.cwd, { async: true } ),
				linkFilter: getLinkFilter( repo ),
				cwd: repo.cwd,
				isRoot: false
			};
		} )
		.then( async externalResults => {
			const mainChangesetGlob = await glob( globPattern, {
				cwd: upath.join( cwd, CHANGESET_DIRECTORY ),
				absolute: true
			} );

			const mainEntry = {
				filePaths: mainChangesetGlob.map( p => upath.normalize( p ) ),
				gitHubUrl: await workspaces.getRepositoryUrl( cwd, { async: true } ),
				linkFilter: getLinkFilter( options ),
				cwd,
				isRoot: true
			};

			return [ mainEntry, ...externalResults ];
		} );
}

type GetLinkFilterOptions = Pick<FindChangelogEntryPathsOptions, 'shouldSkipLinks' | 'linkFilter'>;

function getLinkFilter( options: GetLinkFilterOptions ): LinkFilter {
	if ( typeof options.shouldSkipLinks === 'boolean' ) {
		return () => !options.shouldSkipLinks;
	}

	return options.linkFilter || ( () => true );
}
