/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs-extra';
import { workspaces } from '@ckeditor/ckeditor5-dev-utils';
import { AsyncArray } from './asyncarray.js';
import type { RepositoryConfig } from '../types.js';

type FindPackagesOptions = {
	cwd: string;
	packagesDirectory: string | null;
	externalRepositories: Array<RepositoryConfig>;
	shouldIgnoreRootPackage?: boolean;
};

/**
 * This function gathers package information from both internal and external repositories.
 */
export async function findPackages( options: FindPackagesOptions ): Promise<Map<string, string>> {
	const {
		cwd,
		packagesDirectory,
		externalRepositories,
		shouldIgnoreRootPackage = false
	} = options;

	const externalPackagesPromises = externalRepositories.map( externalRepository => {
		return workspaces.findPathsToPackages(
			externalRepository.cwd,
			externalRepository.packagesDirectory,
			{ includePackageJson: true }
		);
	} );

	const promise = Promise.all( [
		workspaces.findPathsToPackages( cwd, packagesDirectory, { includeCwd: !shouldIgnoreRootPackage, includePackageJson: true } ),
		...externalPackagesPromises
	] );

	return AsyncArray.from( promise )
		.flat()
		.map<workspaces.PackageJson>( packagePath => fs.readJson( packagePath ) )
		.map<[ string, string ]>( ( { name, version } ) => [ name, version ] )
		.then( entries => new Map( entries.sort( ( [ a ], [ b ] ) => a.localeCompare( b ) ) ) );
}

