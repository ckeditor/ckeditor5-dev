/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { globSync } = require( 'glob' );
const fs = require( 'fs-extra' );
const semver = require( 'semver' );
const { normalizeTrim, join, toUnix } = require( 'upath' );
const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );
const getPackageJson = require( '../utils/getpackagejson' );

/**
 * The purpose of the script is to update the version of a root package found in the current working
 * directory and packages if the `options.packagesDirectory` path is provided.
 *
 * @param {Object} options
 * @param {String} options.version Version to store in a `package.json` file under the `version` key.
 * @param {String} [options.packagesDirectory] Relative path to a location of packages to update. If not specified,
 * only the root package is checked.
 * @param {String} [options.cwd=process.cwd()] Current working directory from which all paths will be resolved.
 */
module.exports = function updateVersions( { packagesDirectory, version, cwd = process.cwd() } ) {
	const normalizedCwd = toUnix( cwd );
	const normalizedPackagesDir = packagesDirectory ? normalizeTrim( packagesDirectory ) : null;
	const packagesGlobs = normalizedPackagesDir ? [ normalizedPackagesDir + '/*', './' ] : './';
	const packagesPaths = globSync( packagesGlobs, { cwd: normalizedCwd, absolute: true } );

	checkVersionGreaterThanOldVersion( version, getPackageJson( normalizedCwd ).version );
	checkVersionIsAvailableInNpm( version, getRandomPackageJson( normalizedPackagesDir, normalizedCwd ).name );

	for ( const packagePath of packagesPaths ) {
		const packageJsonPath = join( packagePath, 'package.json' );
		const packageJson = getPackageJson( packagePath );

		packageJson.version = version;
		fs.outputJsonSync( packageJsonPath, packageJson, { spaces: 2 } );
	}
};

/**
 * @param {String} packagesDirectory
 * @param {String } cwd
 * @returns {Object}
 */
function getRandomPackageJson( packagesDirectory, cwd ) {
	const globs = packagesDirectory ? packagesDirectory + '/*' : './';
	const packagesPaths = globSync( globs, { cwd, absolute: true } );
	const randomPackagePath = packagesPaths[ Math.floor( Math.random() * packagesPaths.length ) ];

	return getPackageJson( randomPackagePath );
}

/**
 * @param {String} newVersion
 * @param {String} currentVersion
 */
function checkVersionGreaterThanOldVersion( newVersion, currentVersion ) {
	if ( !semver.valid( newVersion ) ) {
		throw new Error( `Provided version ${ newVersion } must be a valid semver version.` );
	}

	if ( !semver.gt( newVersion, currentVersion ) ) {
		throw new Error( `Provided version ${ newVersion } must be greater than ${ currentVersion }.` );
	}
}

/**
 * @param {String} version
 * @param {String} packageName
 */
function checkVersionIsAvailableInNpm( version, packageName ) {
	try {
		tools.shExec( `npm show ${ packageName }@${ version } version`, { verbosity: 'silent' } );

		throw new Error( `Provided version ${ version } is already used in npm by ${ packageName }.` );
	} catch ( e ) {
		if ( !e.toString().includes( 'is not in this registry' ) ) {
			throw e;
		}
	}
}
