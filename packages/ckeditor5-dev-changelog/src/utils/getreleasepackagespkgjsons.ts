/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fsExtra from 'fs-extra';
import type { PackageJson, RepositoryConfig } from '../types.js';
import { findPathsToPackages } from './findpathstopackages.js';

/**
 * Retrieves package.json files for all packages that need to be released.
 * This function gathers package information from both internal and external repositories.
 */
export async function getReleasePackagesPkgJsons(
	cwd: string,
	packagesDirectory: string,
	externalRepositories: Array<RepositoryConfig>
): Promise<Array<PackageJson>> {
	const externalPackagesPromises = externalRepositories.map( externalRepository =>
		findPathsToPackages( externalRepository.cwd, externalRepository.packagesDirectory, { includePackageJson: true } )
	);

	const packagesPaths = ( await Promise.all( [
		findPathsToPackages( cwd, packagesDirectory, { includeCwd: true, includePackageJson: true } ),
		...externalPackagesPromises
	] ) ).flat();

	const packagesPromises = packagesPaths.map( packagePath =>
		fsExtra.readJson( packagePath )
	);

	return Promise.all( packagesPromises );
}
