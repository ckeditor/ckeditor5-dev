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
 * Updates version of root package and subpackages if `packagesDirectory` path is provided.
 *
 * @param {Object} options
 * @param {String} options.version
 * @param {String} [options.packagesDirectory]
 * @param {String} [options.cwd]
 */
module.exports = function updateVersions( { packagesDirectory, version, cwd = process.cwd() } ) {
	const normCwd = toUnix( cwd );
	const normPackagesDir = packagesDirectory ? normalizeTrim( packagesDirectory ) : packagesDirectory;
	const packagesGlobs = normPackagesDir ? [ normPackagesDir + '/*', './' ] : './';
	const packagesPaths = globSync( packagesGlobs, { cwd: normCwd, absolute: true } );

	checkVersionGreaterThanOldVersion( version, getPackageJson( normCwd ).version );
	checkVersionIsAvailableInNpm( version, getRandomPackageJson( normPackagesDir, normCwd ).name );

	for ( const packagePath of packagesPaths ) {
		const packageJsonPath = join( packagePath, 'package.json' );
		const packageJson = getPackageJson( packagePath );

		fs.outputJsonSync( packageJsonPath, { ...packageJson, version }, { spaces: 2 } );
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
 * @param {String} oldVersion
 */
function checkVersionGreaterThanOldVersion( newVersion, oldVersion ) {
	if ( !semver.valid( newVersion ) ) {
		throw new Error( `Provided version ${ newVersion } must be a valid semver version.` );
	}

	if ( !semver.gt( newVersion, oldVersion ) ) {
		throw new Error( `Provided version ${ newVersion } must be greater than ${ oldVersion }.` );
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
