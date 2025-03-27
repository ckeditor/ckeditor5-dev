/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { PackageJson, RepositoryConfig } from '../types.js';
import { findPathsToPackages } from './findpathstopackages.js';
import fsExtra from 'fs-extra';
import upath from 'upath';

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
		findPathsToPackages( externalRepository.cwd, externalRepository.packagesDirectory )
	);

	const packagesPaths = ( await Promise.all( [
		findPathsToPackages( cwd, packagesDirectory, { includeCwd: true } ),
		...externalPackagesPromises
	] ) ).flat();

	const packagesPromises = packagesPaths.map( packagePath =>
		fsExtra.readJson( upath.join( packagePath, 'package.json' ) )
	);

	return Promise.all( packagesPromises );
}
