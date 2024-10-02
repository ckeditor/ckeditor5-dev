/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import upath from 'upath';
import fs from 'fs-extra';
import { glob } from 'glob';
import semver from 'semver';
import checkVersionAvailability from '../utils/checkversionavailability.js';

const { normalizeTrim, toUnix, dirname, join } = upath;

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
	const normalizedCwd = toUnix( cwd );
	const normalizedPackagesDir = packagesDirectory ? normalizeTrim( packagesDirectory ) : null;

	const globPatterns = getGlobPatterns( normalizedPackagesDir );
	const pkgJsonPaths = await getPackageJsonPaths( cwd, globPatterns, packagesDirectoryFilter );

	const randomPackagePath = getRandomPackagePath( pkgJsonPaths, normalizedPackagesDir );

	const { version: rootPackageVersion } = await readPackageJson( normalizedCwd );
	const { name: randomPackageName } = await readPackageJson( randomPackagePath );

	checkIfVersionIsValid( version, rootPackageVersion );

	const isVersionAvailable = await checkVersionAvailability( version, randomPackageName );

	if ( !isVersionAvailable ) {
		throw new Error( `The "${ randomPackageName }@${ version }" already exists in the npm registry.` );
	}

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
 * @param {string} packagesDirectory
 * @returns {Promise.<object>}
 */
function readPackageJson( packagesDirectory ) {
	const packageJsonPath = join( packagesDirectory, 'package.json' );

	return fs.readJson( packageJsonPath );
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
 * @param {Array.<string>} pkgJsonPaths
 * @param {string|null} packagesDirectory
 * @returns {object}
 */
function getRandomPackagePath( pkgJsonPaths, packagesDirectory ) {
	const randomPkgJsonPaths = packagesDirectory ?
		pkgJsonPaths.filter( packagePath => packagePath.includes( packagesDirectory ) ) :
		pkgJsonPaths;
	const randomPkgJsonPath = randomPkgJsonPaths[ Math.floor( Math.random() * randomPkgJsonPaths.length ) ];

	return dirname( randomPkgJsonPath );
}

/**
 * Checks if the specified version is greater than the current one.
 *
 * A nightly version is always considered as valid.
 *
 * @param {string} newVersion
 * @param {string} currentVersion
 */
function checkIfVersionIsValid( newVersion, currentVersion ) {
	if ( newVersion.startsWith( '0.0.0-nightly' ) ) {
		return;
	}

	if ( !semver.gt( newVersion, currentVersion ) ) {
		throw new Error( `Provided version ${ newVersion } must be greater than ${ currentVersion } or match pattern 0.0.0-nightly.` );
	}
}

/**
 * @callback UpdateVersionsPackagesDirectoryFilter
 *
 * @param {string} packageJsonPath An absolute path to a `package.json` file.
 *
 * @returns {boolean} Whether to include (`true`) or skip (`false`) processing the given directory/package.
 */
