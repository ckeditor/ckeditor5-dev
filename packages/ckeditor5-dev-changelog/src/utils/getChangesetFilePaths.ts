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
	const externalChangesetFilePaths = externalRepositories.map( repo =>
		glob( '**/*.md', { cwd: upath.join( repo.cwd, changesetsDirectory ), absolute: true } )
	);

	return [
		...await glob( '**/*.md', { cwd: upath.join( cwd, changesetsDirectory ), absolute: true } ),
		...await Promise.all( externalChangesetFilePaths )
	].flat();
}
