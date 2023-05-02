/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { globSync } = require( 'glob' );
const path = require( 'path' );
const fs = require( 'fs-extra' );
const semver = require( 'semver' );
const getPackageJson = require( '../utils/getpackagejson' );
const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );

/**
 * @param {Object} options
 * @param {String} options.version
 * @param {String} [options.packagesDirectory]
 * @param {String} [options.cwd]
 */
module.exports = function updateVersions( { packagesDirectory, version, cwd = process.cwd() } ) {
	const packagesGlobs = packagesDirectory ? [ packagesDirectory + '/*', './' ] : './';
	const packagesPaths = globSync( packagesGlobs, { cwd, absolute: true } );

	checkVersionGreatherThanOldVersion( version, getPackageJson( cwd ).version );
	checkVersionIsAvailableInNpm( version, getRandomPackageJson( packagesDirectory, cwd ).name );

	for ( const packagePath of packagesPaths ) {
		const packageJsonPath = path.join( packagePath, 'package.json' );
		const packageJson = getPackageJson( packagePath );

		fs.outputJsonSync( packageJsonPath, { ...packageJson, version }, { replacer: null, spaces: 2 } );
	}
};

function getRandomPackageJson( packagesDirectory, cwd ) {
	const globs = packagesDirectory ? packagesDirectory + '/*' : './';
	const packagesPaths = globSync( globs, { cwd, absolute: true } );
	const randomPackagePath = packagesPaths[ Math.floor( Math.random() * packagesPaths.length ) ];
	return getPackageJson( randomPackagePath );
}

function checkVersionGreatherThanOldVersion( newVersion, oldVersion ) {
	if ( newVersion.match( /^0\.0\.0-.*$/ ) ) {
		return;
	}

	if ( !semver.gt( newVersion, oldVersion ) ) {
		throw new Error( `Version ${ newVersion } must be greater than ${ oldVersion } or match 0.0.0-<...>.` );
	}
}

function checkVersionIsAvailableInNpm( version, packageName ) {
	try {
		tools.shExec( `npm show ${ packageName }@${ version } version`, { verbosity: 'silent' } );

		throw new Error( `Version ${ version } is already used in npm by ${ packageName }.` );
	} catch ( e ) {
		if ( !e.toString().includes( 'is not in this registry' ) ) {
			throw e;
		}
	}
}
