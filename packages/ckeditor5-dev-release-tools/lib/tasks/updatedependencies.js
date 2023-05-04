/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs-extra' );
const { globSync } = require( 'glob' );
const { logger } = require( '@ckeditor/ckeditor5-dev-utils' );
const normalizePath = require( '../utils/normalizepath' );

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
 * @param {Object} options
 * @param {String} options.version Target version to which all of the eligible dependencies will be updated.
 * @param {String} options.shouldUpdateVersionCallback Callback function that decides whether to update a version for a dependency.
 * @param {String} [options.packagesDirectory] Relative path to a location of packages to update their dependencies.
 * @param {String} [options.cwd] Current working directory from which all paths will be resolved.
 */
module.exports = function updateDependencies( options ) {
	const log = logger();

	log.info( 'Task: updateDependencies()' );

	const {
		version,
		packagesDirectory,
		shouldUpdateVersionCallback,
		cwd = process.cwd()
	} = options;

	const globOptions = {
		cwd,
		nodir: true,
		absolute: true
	};

	const globPatterns = [ 'package.json' ];

	if ( packagesDirectory ) {
		const packagesDirectoryPattern = normalizePath( packagesDirectory ) + '/*/package.json';

		globPatterns.push( packagesDirectoryPattern );
	}

	const pkgJsonPaths = globSync( globPatterns, globOptions );

	for ( const pkgJsonPath of pkgJsonPaths ) {
		log.info( `Updating dependencies in "${ pkgJsonPath }".` );

		const pkgJson = fs.readJsonSync( pkgJsonPath );

		updateVersion( pkgJson.dependencies, version, shouldUpdateVersionCallback );
		updateVersion( pkgJson.devDependencies, version, shouldUpdateVersionCallback );
		updateVersion( pkgJson.peerDependencies, version, shouldUpdateVersionCallback );

		fs.writeJsonSync( pkgJsonPath, pkgJson, { spaces: 2 } );
	}
};

/**
 * Updates the version for each eligible dependency.
 *
 * @param {Object} object Object containing dependencies to update, where the key is a package name and the value is its version.
 * @param {String} version Target version to which all of the eligible dependencies will be updated.
 * @param {Function} callback Callback function that decides whether to update a version for a dependency.
 */
function updateVersion( object, version, callback ) {
	if ( !object ) {
		return;
	}

	for ( const packageName of Object.keys( object ) ) {
		if ( callback( packageName ) ) {
			object[ packageName ] = version;
		}
	}
}
