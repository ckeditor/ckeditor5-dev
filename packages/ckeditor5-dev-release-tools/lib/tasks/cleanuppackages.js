/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs-extra' );
const upath = require( 'upath' );
const { globSync } = require( 'glob' );
const { logger } = require( '@ckeditor/ckeditor5-dev-utils' );

/**
 * The purpose of the script is to clean the package prepared for the release. Cleaning consists of two stages:
 *
 * - Remove unnecessary files from the package directory.
 * - Remove unnecessary fields from the `package.json` file.
 *
 * @param {Object} options
 * @param {String} options.packagesDirectory Relative path to a location of packages to be cleaned up.
 * @param {Array.<String>} [options.packageJsonFieldsToRemove] Fields to remove from `package.json`. If not set, a predefined list is used.
 * @param {String} [options.cwd=process.cwd()] Current working directory from which all paths will be resolved.
 */
module.exports = function cleanUpPackages( options ) {
	const log = logger();

	log.info( 'Task: cleanUpPackages()' );

	const { packagesDirectory, packageJsonFieldsToRemove, cwd } = parseOptions( options );

	const packageJsonPaths = globSync( packagesDirectory + '/*/package.json', {
		cwd,
		nodir: true,
		absolute: true
	} );

	for ( const packageJsonPath of packageJsonPaths ) {
		log.info( `Cleaning up: "${ packageJsonPath }".` );

		const packagePath = upath.dirname( packageJsonPath );
		const packageJson = fs.readJsonSync( packageJsonPath );

		cleanUpPackageDirectory( packageJson, packagePath );
		cleanUpPackageJson( packageJson, packageJsonFieldsToRemove );

		fs.writeJsonSync( packageJsonPath, packageJson, { spaces: 2 } );
	}
};

function parseOptions( options ) {
	const {
		packagesDirectory,
		packageJsonFieldsToRemove = [ 'devDependencies', 'depcheckIgnore', 'scripts' ],
		cwd = process.cwd()
	} = options;

	return {
		packagesDirectory: upath.normalizeTrim( packagesDirectory ),
		packageJsonFieldsToRemove,
		cwd: upath.normalizeTrim( cwd )
	};
}

function cleanUpPackageDirectory( packageJson, packagePath ) {
	if ( !packageJson.files ) {
		return;
	}

	const pathsToRemove = globSync( '**', {
		cwd: packagePath,
		absolute: true,
		nodir: true,
		ignore: [
			'README.md',
			'LICENSE.md',
			'package.json',
			...getIgnoredFilePatterns( packageJson )
		]
	} );

	for ( const pathToRemove of pathsToRemove ) {
		fs.removeSync( pathToRemove );
	}

	const directories = globSync( '**/', {
		cwd: packagePath,
		absolute: true
	} )
		.map( path => upath.normalize( path ) )
		.sort( sortPathsFromDeepestFirst );

	for ( const pathToDirectory of directories ) {
		const isEmpty = fs.readdirSync( pathToDirectory ).length === 0;

		if ( isEmpty ) {
			fs.removeSync( pathToDirectory );
		}
	}
}

function getIgnoredFilePatterns( packageJson ) {
	const patterns = packageJson.files.flatMap( pattern => [ pattern, pattern + '/**' ] );

	if ( packageJson.main ) {
		patterns.push( packageJson.main );
	}

	return patterns;
}

function cleanUpPackageJson( packageJson, packageJsonFieldsToRemove ) {
	for ( const key of Object.keys( packageJson ) ) {
		if ( packageJsonFieldsToRemove.includes( key ) ) {
			delete packageJson[ key ];
		}
	}
}

function sortPathsFromDeepestFirst( firstPath, secondPath ) {
	const firstPathSegments = firstPath.split( '/' ).length;
	const secondPathSegments = secondPath.split( '/' ).length;

	if ( firstPathSegments > secondPathSegments ) {
		return -1;
	}

	if ( firstPathSegments < secondPathSegments ) {
		return 1;
	}

	return 0;
}
