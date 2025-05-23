/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import upath from 'upath';
import chalk from 'chalk';
import { git } from '@ckeditor/ckeditor5-dev-utils';
import { logInfo } from './loginfo.js';
import { CHANGELOG_FILE } from '../constants.js';
import type { ChangesetPathsWithGithubUrl } from '../types.js';

type RepositoryData = Pick<ChangesetPathsWithGithubUrl, 'cwd' | 'isRoot' | 'changesetPaths'>;

export async function commitChanges( version: string, repositories: Array<RepositoryData> ): Promise<void> {
	const message = `Changelog for v${ version }. [skip ci]`;

	logInfo( `○ ${ chalk.cyan( 'Committing changes...' ) }` );

	for ( const { cwd, isRoot, changesetPaths } of repositories ) {
		// Copy to avoid modifying the original array.
		const files = changesetPaths.slice( 0 );

		if ( isRoot ) {
			files.unshift( upath.join( cwd, CHANGELOG_FILE ) );
		}

		logInfo( `◌ Processing "${ cwd }".`, { indent: 1 } );

		await git.commit( { cwd, message, files } );
	}
}
