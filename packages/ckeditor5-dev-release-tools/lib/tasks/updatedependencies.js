/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs-extra';
import { glob } from 'glob';
import upath from 'upath';

/**
 * The purpose of this script is to update all eligible dependencies to a version specified in the `options.version`. The following packages
 * are taken into consideration:
 *
 * - The root package located in `options.cwd` path.
 * - All packages located in the `options.packagesDirectory` path relative to `options.cwd`.
 *
 * The eligible dependencies are distinguished by the return value from the `options.shouldUpdateVersionCallback` function. Only if this
 * callback returns a truthy value for a given dependency, its version will be updated.
 *
 * @param {object} options
 * @param {string} options.version Target version or a range version to which all eligible dependencies will be updated.
 * Examples: `1.0.0`, `^1.0.0`, etc.
 * @param {UpdateVersionCallback} options.shouldUpdateVersionCallback Callback function that decides whether to update a version
 * for a dependency. It receives a package name as an argument and should return a boolean value.
 * @param {UpdateDependenciesPackagesDirectoryFilter|null} [options.packagesDirectoryFilter=null] An optional callback allowing
 * filtering out directories/packages that should not be touched by the task.
 * @param {string} [options.packagesDirectory] Relative path to a location of packages to update their dependencies. If not specified,
 * only the root package is checked.
 * @param {string} [options.cwd=process.cwd()] Current working directory from which all paths will be resolved.
 * @returns {Promise}
 */
export default async function updateDependencies( options ) {
	const {
		version,
		packagesDirectory,
		shouldUpdateVersionCallback,
		packagesDirectoryFilter = null,
		cwd = process.cwd()
	} = options;

	const globPatterns = [ 'package.json' ];

	if ( packagesDirectory ) {
		const packagesDirectoryPattern = upath.join( packagesDirectory, '*', 'package.json' );

		globPatterns.push( packagesDirectoryPattern );
	}

	const pkgJsonPaths = await getPackageJsonPaths( cwd, globPatterns, packagesDirectoryFilter );

	for ( const pkgJsonPath of pkgJsonPaths ) {
		const pkgJson = await fs.readJson( pkgJsonPath );

		updateVersion( version, shouldUpdateVersionCallback, pkgJson.dependencies );
		updateVersion( version, shouldUpdateVersionCallback, pkgJson.devDependencies );
		updateVersion( version, shouldUpdateVersionCallback, pkgJson.peerDependencies );

		await fs.writeJson( pkgJsonPath, pkgJson, { spaces: 2 } );
	}
}

/**
 * Updates the version for each eligible dependency.
 *
 * @param {string} version
 * @param {function} callback
 * @param {object} [dependencies]
 */
function updateVersion( version, callback, dependencies ) {
	if ( !dependencies ) {
		return;
	}

	for ( const packageName of Object.keys( dependencies ) ) {
		if ( callback( packageName ) ) {
			dependencies[ packageName ] = version;
		}
	}
}

/**
 * @param {string} cwd
 * @param {Array.<string>} globPatterns
 * @param {UpdateDependenciesPackagesDirectoryFilter|null} packagesDirectoryFilter
 * @returns {Promise.<Array.<string>>}
 */
async function getPackageJsonPaths( cwd, globPatterns, packagesDirectoryFilter ) {
	const globOptions = {
		cwd,
		nodir: true,
		absolute: true
	};

	const pkgJsonPaths = await glob( globPatterns, globOptions );

	if ( !packagesDirectoryFilter ) {
		return pkgJsonPaths;
	}

	return pkgJsonPaths.filter( packagesDirectoryFilter );
}

/**
 * @callback UpdateVersionCallback
 *
 * @param {string} packageName A package name.
 *
 * @returns {boolean} Whether to update (`true`) or ignore (`false`) bumping the package version.
 */

/**
 * @callback UpdateDependenciesPackagesDirectoryFilter
 *
 * @param {string} packageJsonPath An absolute path to a `package.json` file.
 *
 * @returns {boolean} Whether to include (`true`) or skip (`false`) processing the given directory/package.
 */
