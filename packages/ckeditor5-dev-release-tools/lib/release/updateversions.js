/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { globSync } = require( 'glob' );
const fs = require( 'fs-extra' );
const semver = require( 'semver' );
const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );
const getPackageJson = require( '../utils/getpackagejson' );
const normalizePath = require( '../utils/normalizepath' );

/**
 * Updates version of root package and subpackages if `packagesDirectory` path is provided.
 *
 * @param {Object} options
 * @param {String} options.version
 * @param {String} [options.packagesDirectory]
 * @param {String} [options.cwd]
 */
module.exports = function updateVersions( { packagesDirectory, version, cwd = process.cwd() } ) {
	const normalizedPackagesDir = normalizePath( packagesDirectory );
	const packagesGlobs = normalizedPackagesDir ? [ normalizedPackagesDir + '/*/package.json', 'package.json' ] : 'package.json';
	const packagesPaths = globSync( packagesGlobs, { cwd, absolute: true } );

	checkVersionGreatherThanOldVersion( version, getPackageJson( cwd ).version );
	checkVersionIsAvailableInNpm( version, getRandomPackageJson( normalizedPackagesDir, cwd ).name );

	for ( const packageJsonPath of packagesPaths ) {
		const packageJson = fs.readJsonSync( packageJsonPath );

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
function checkVersionGreatherThanOldVersion( newVersion, oldVersion ) {
	if ( newVersion.match( /^0\.0\.0-.*$/ ) ) {
		return;
	}

	if ( !semver.gt( newVersion, oldVersion ) ) {
		throw new Error( `Provided version ${ newVersion } must be greater than ${ oldVersion } or match 0.0.0-<...>.` );
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
