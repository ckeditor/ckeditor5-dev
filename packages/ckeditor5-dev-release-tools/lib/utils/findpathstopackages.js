/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import upath from 'upath';
import { glob } from 'glob';

/**
 * Returns an array containing paths to packages found in the `packagesDirectory` directory.
 *
 * @param {string} cwd
 * @param {string|null} packagesDirectory
 * @param {object} [options={}]
 * @param {boolean} [options.includePackageJson=false]
 * @param {boolean} [options.includeCwd=false]
 * @param {PackagesDirectoryFilter|null} [options.packagesDirectoryFilter=null]
 * @returns {Array.<string>}
 */
export default async function findPathsToPackages( cwd, packagesDirectory, options = {} ) {
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

/**
 * @param {string} cwd
 * @param {string|null} packagesDirectory
 * @param {boolean} includePackageJson
 * @returns {Promise.<Array.<string>>}
 */
function getPackages( cwd, packagesDirectory, includePackageJson ) {
	if ( !packagesDirectory ) {
		return [];
	}

	const globOptions = {
		cwd: upath.join( cwd, packagesDirectory ),
		absolute: true
	};

	let pattern = '*/';

	if ( includePackageJson ) {
		pattern += 'package.json';
		globOptions.nodir = true;
	}

	return glob( pattern, globOptions );
}

/**
 * @callback PackagesDirectoryFilter
 *
 * @param {string} packageJsonPath An absolute path to a `package.json` file.
 *
 * @returns {boolean} Whether to include (`true`) or skip (`false`) processing the given directory/package.
 */
