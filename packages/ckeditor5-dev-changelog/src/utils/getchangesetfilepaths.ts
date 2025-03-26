/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { RepositoryConfig } from '../types.js';
import { glob } from 'glob';
import upath from 'upath';

export async function getChangesetFilePaths(
	cwd: string,
	changesetsDirectory: string,
	externalRepositories: Array<RepositoryConfig>
): Promise<Array<string>> {
	const externalChangesetPaths = externalRepositories.map( repo =>
		glob( '**/*.md', { cwd: upath.join( repo.cwd, changesetsDirectory ), absolute: true } )
	);

	const resolvedChangesetPaths = await Promise.all( [
		glob( '**/*.md', { cwd: upath.join( cwd, changesetsDirectory ), absolute: true } ),
		...externalChangesetPaths
	] );

	return resolvedChangesetPaths.flat();
}
