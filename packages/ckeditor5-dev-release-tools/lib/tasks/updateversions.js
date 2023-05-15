/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { globSync } = require( 'glob' );
const fs = require( 'fs-extra' );
const semver = require( 'semver' );
const { normalizeTrim, toUnix, dirname } = require( 'upath' );
const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );
const getPackageJson = require( '../utils/getpackagejson' );

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
 * @param {Object} options
 * @param {String} options.version Version to store in a `package.json` file under the `version` key.
 * @param {String} [options.packagesDirectory] Relative path to a location of packages to update. If not specified,
 * only the root package is checked.
 * @param {String} [options.cwd=process.cwd()] Current working directory from which all paths will be resolved.
 * @returns {Promise<Void>}
 */
module.exports = async function updateVersions( { packagesDirectory, version, cwd = process.cwd() } ) {
	const normalizedCwd = toUnix( cwd );
	const normalizedPackagesDir = packagesDirectory ? normalizeTrim( packagesDirectory ) : null;
	const globPatterns = [ 'package.json' ];

	if ( packagesDirectory ) {
		globPatterns.push( normalizedPackagesDir + '/*/package.json' );
	}

	const pkgJsonPaths = globSync( globPatterns, { cwd: normalizedCwd, absolute: true, nodir: true } );
	const randomPackagePath = getRandomPackagePath( pkgJsonPaths, normalizedPackagesDir );

	checkIfVersionIsValid( version, getPackageJson( normalizedCwd ).version );
	checkVersionAvailability( version, getPackageJson( randomPackagePath ).name );

	for ( const pkgJsonPath of pkgJsonPaths ) {
		const pkgJson = getPackageJson( pkgJsonPath );

		pkgJson.version = version;
		await fs.writeJson( pkgJsonPath, pkgJson, { spaces: 2 } );
	}
};

/**
 * @param {Array.<String>} pkgJsonPaths
 * @param {String|null} packagesDirectory
 * @returns {Object}
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
 * @param {String} newVersion
 * @param {String} currentVersion
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
 * Checks if the provided version is not used in npm and there will be no errors when calling publish.
 *
 * @param {String} version
 * @param {String} packageName
 */
function checkVersionAvailability( version, packageName ) {
	try {
		tools.shExec( `npm show ${ packageName }@${ version } version`, { verbosity: 'silent' } );

		throw new Error( `Provided version ${ version } is already used in npm by ${ packageName }.` );
	} catch ( e ) {
		if ( !e.toString().includes( 'is not in this registry' ) ) {
			throw e;
		}
	}
}
