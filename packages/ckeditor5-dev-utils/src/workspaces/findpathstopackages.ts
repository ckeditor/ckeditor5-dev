/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import upath from 'upath';
import { glob, type GlobOptions } from 'tinyglobby';

type Options = {
	includePackageJson?: boolean;
	includeCwd?: boolean;
	packagesDirectoryFilter?: ( ( packageJsonPath: string ) => boolean ) | null;
};

/**
 * This function locates package.json files for all packages located in `packagesDirectory` in the repository structure.
 */
export default async function findPathsToPackages(
	cwd: string,
	packagesDirectory: string | null,
	options: Options = {}
): Promise<Array<string>> {
	const {
		includePackageJson = false,
		includeCwd = false,
		packagesDirectoryFilter = null
	} = options;

	const packagePaths = await getPackages( cwd, packagesDirectory, includePackageJson );

	if ( includeCwd ) {
		if ( includePackageJson ) {
			packagePaths.push( upath.join( cwd, 'package.json' ) );
		} else {
			packagePaths.push( cwd );
		}
	}

	const normalizedPaths = packagePaths.map( item => upath.normalize( item ) );

	if ( packagesDirectoryFilter ) {
		return normalizedPaths.filter( item => packagesDirectoryFilter( item ) );
	}

	return normalizedPaths;
}

async function getPackages( cwd: string, packagesDirectory: string | null, includePackageJson: boolean ): Promise<Array<string>> {
	if ( !packagesDirectory ) {
		return Promise.resolve( [] );
	}

	const globOptions: GlobOptions = {
		cwd: upath.join( cwd, packagesDirectory ),
		absolute: true,
		onlyDirectories: true
	};

	let pattern = '*/';

	if ( includePackageJson ) {
		pattern += 'package.json';
		globOptions.onlyDirectories = false;
	}

	const paths = await glob( pattern, globOptions );

	return paths.map( path => upath.normalize( path ) );
}
