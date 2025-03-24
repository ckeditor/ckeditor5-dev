/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { PackageJson, RepositoryConfig } from '../types.js';
import { findPathsToPackages } from '@ckeditor/ckeditor5-dev-release-tools';
import fsExtra from 'fs-extra';
import upath from 'upath';

export async function getReleasePackagesPkgJsons(
	cwd: string,
	packagesDirectory: string,
	externalRepositories: Array<RepositoryConfig>
): Promise<Array<PackageJson>> {
	const externalPackagesPromises = externalRepositories.map( externalRepository =>
		findPathsToPackages( externalRepository.cwd, externalRepository.packagesDirectory )
	);

	const packagesPaths = [
		...await findPathsToPackages( cwd, packagesDirectory, { includeCwd: true } ),
		...await Promise.all( externalPackagesPromises )
	].flat();

	const packagesPromises = packagesPaths.map( packagePath =>
		fsExtra.readJson( upath.join( packagePath, 'package.json' ) )
	);

	return await Promise.all( packagesPromises );
}
