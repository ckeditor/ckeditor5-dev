/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import upath from 'upath';
import fs from 'fs-extra';
import { glob } from 'glob';
import semver from 'semver';

const { normalizeTrim } = upath;

/**
 * The purpose of the script is to update the version of a root package found in the current working
 * directory and packages if the `options.packagesDirectory` path is provided.
 *
 * Before updating phase, the specified version must meet the following conditions:
 *
 * * It must not be in use in the npm registry.
 * * It must be higher than the version specified in the root package (found in the `cwd` directory).
 *   Exception: passing a version starting with the `0.0.0-nightly` string. It is used for publishing
 *   a nightly release.
 *
 * @param {object} options
 * @param {string} options.version Version to store in a `package.json` file under the `version` key.
 * @param {UpdateVersionsPackagesDirectoryFilter|null} [options.packagesDirectoryFilter=null] An optional callback allowing filtering out
 * directories/packages that should not be touched by the task.
 * @param {string} [options.packagesDirectory] Relative path to a location of packages to update. If not specified,
 * only the root package is checked.
 * @param {string} [options.cwd=process.cwd()] Current working directory from which all paths will be resolved.
 * @returns {Promise}
 */
export default async function updateVersions( options ) {
	const {
		packagesDirectory,
		version,
		packagesDirectoryFilter = null,
		cwd = process.cwd()
	} = options;
	const normalizedPackagesDir = packagesDirectory ? normalizeTrim( packagesDirectory ) : null;

	const globPatterns = getGlobPatterns( normalizedPackagesDir );
	const pkgJsonPaths = await getPackageJsonPaths( cwd, globPatterns, packagesDirectoryFilter );

	checkIfVersionIsValid( version );

	for ( const pkgJsonPath of pkgJsonPaths ) {
		const pkgJson = await fs.readJson( pkgJsonPath );

		pkgJson.version = version;
		await fs.writeJson( pkgJsonPath, pkgJson, { spaces: 2 } );
	}
}

/**
 * @param {string} cwd
 * @param {Array.<string>} globPatterns
 * @param {UpdateVersionsPackagesDirectoryFilter|null} packagesDirectoryFilter
 * @returns {Promise.<Array.<string>>}
 */
async function getPackageJsonPaths( cwd, globPatterns, packagesDirectoryFilter ) {
	const pkgJsonPaths = await glob( globPatterns, {
		cwd,
		absolute: true,
		nodir: true
	} );

	if ( !packagesDirectoryFilter ) {
		return pkgJsonPaths;
	}

	return pkgJsonPaths.filter( packagesDirectoryFilter );
}

/**
 * @param {string|null} packagesDirectory
 * @returns {Array.<string>}
 */
function getGlobPatterns( packagesDirectory ) {
	const patterns = [ 'package.json' ];

	if ( packagesDirectory ) {
		patterns.push( packagesDirectory + '/*/package.json' );
	}

	return patterns;
}

/**
 * @param {string} version
 */
function checkIfVersionIsValid( version ) {
	if ( !semver.valid( version ) ) {
		throw new Error( `Provided version ${ version } must follow the "Semantic Versioning" standard.` );
	}
}

/**
 * @callback UpdateVersionsPackagesDirectoryFilter
 *
 * @param {string} packageJsonPath An absolute path to a `package.json` file.
 *
 * @returns {boolean} Whether to include (`true`) or skip (`false`) processing the given directory/package.
 */
