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
 * The purpose of the script is to clean all packages prepared for the release. The cleaning consists of two stages:
 *
 * - Remove unnecessary files and directories from the package directory.
 * - Remove unnecessary fields from the `package.json` file.
 *
 * @param {Object} options
 * @param {String} options.packagesDirectory Relative path to a location of packages to be cleaned up.
 * @param {Array.<String>} [options.packageJsonFieldsToRemove] Fields to remove from `package.json`. If not set, a predefined list is used.
 * @param {String} [options.cwd] Current working directory from which all paths will be resolved.
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
		const packagePath = upath.dirname( packageJsonPath );
		const packageJson = fs.readJsonSync( packageJsonPath );

		log.info( `Cleaning up: "${ packagePath }".` );

		cleanUpPackageDirectory( packageJson, packagePath );
		cleanUpPackageJson( packageJson, packageJsonFieldsToRemove );

		fs.writeJsonSync( packageJsonPath, packageJson, { spaces: 2 } );
	}
};

/**
 * Prepares the configuration options for the script.
 *
 * @param {Object} options
 * @param {String} options.packagesDirectory
 * @param {Array.<String>} [options.packageJsonFieldsToRemove=['devDependencies','depcheckIgnore','scripts']]
 * @param {String} [options.cwd=process.cwd()]
 * @returns {Object}
 */
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

/**
 * Remove unnecessary files and directories from the package directory.
 *
 * @param {Object} packageJson
 * @param {String} packagePath
 */
function cleanUpPackageDirectory( packageJson, packagePath ) {
	if ( packageJson.files ) {
		// Find and remove files that don't match the `files` field in the `package.json`.
		const files = globSync( '**', {
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

		for ( const file of files ) {
			fs.removeSync( file );
		}
	}

	// Find and remove empty directories in the package directory.
	const directories = globSync( '**/', {
		cwd: packagePath,
		absolute: true
	} )
		.map( path => upath.normalize( path ) )
		.sort( sortPathsFromDeepestFirst );

	for ( const directory of directories ) {
		const isEmpty = fs.readdirSync( directory ).length === 0;

		if ( isEmpty ) {
			fs.removeSync( directory );
		}
	}

	// Remove `node_modules`.
	fs.removeSync( upath.join( packagePath, 'node_modules' ) );
}

/**
 * Creates an array of patterns to ignore for the `glob` calls.
 *
 * @param {Object} packageJson
 * @returns {Array.<String>}
 */
function getIgnoredFilePatterns( packageJson ) {
	// The patterns supported by `package.json` in the `files` field do not correspond 1:1 to the patterns expected by the `glob`.
	// For this reason, we always treat each pattern from `files` as if it was the beginning of a path to match - not just a final path.
	//
	// Example: for the entry `src` we prepare the `src/**` pattern for `glob`.
	//
	// If the globstar pattern (`**`) is alone in a path portion, then it matches zero or more directories and subdirectories.
	const patterns = packageJson.files.map( pattern => pattern + '/**' );

	if ( packageJson.main ) {
		patterns.push( packageJson.main );
	}

	if ( packageJson.types ) {
		patterns.push( packageJson.types );
	}

	return patterns;
}

/**
 * Removes unnecessary fields from the `package.json`.
 *
 * @param {Object} packageJson
 * @param {Array.<String>} packageJsonFieldsToRemove
 */
function cleanUpPackageJson( packageJson, packageJsonFieldsToRemove ) {
	for ( const key of Object.keys( packageJson ) ) {
		if ( packageJsonFieldsToRemove.includes( key ) ) {
			delete packageJson[ key ];
		}
	}
}

/**
 * Sort function that defines the order of the paths. It sorts paths from the most nested ones first.
 *
 * @param {String} firstPath
 * @param {String} secondPath
 * @returns {Number}
 */
function sortPathsFromDeepestFirst( firstPath, secondPath ) {
	const firstPathSegments = firstPath.split( '/' ).length;
	const secondPathSegments = secondPath.split( '/' ).length;

	return secondPathSegments - firstPathSegments;
}
