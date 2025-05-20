/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs-extra';
import type { PackageJson, RepositoryConfig } from '../types.js';
import { workspaces } from '@ckeditor/ckeditor5-dev-utils';

/**
 * This function gathers package information from both internal and external repositories.
 */
export async function getPackageJsons(
	cwd: string,
	packagesDirectory: string,
	externalRepositories: Array<Required<RepositoryConfig>>
): Promise<Array<PackageJson>> {
	const externalPackagesPromises = externalRepositories.map( externalRepository => {
		return workspaces.findPathsToPackages(
			externalRepository.cwd,
			externalRepository.packagesDirectory,
			{ includePackageJson: true }
		);
	} );

	const promises = Promise.all( [
		workspaces.findPathsToPackages( cwd, packagesDirectory, { includeCwd: true, includePackageJson: true } ),
		...externalPackagesPromises
	] );

	const packagesPromises = ( await promises )
		.flat()
		.map( packagePath => {
			return fs.readJson( packagePath );
		} );

	return Promise.all( packagesPromises );
}
