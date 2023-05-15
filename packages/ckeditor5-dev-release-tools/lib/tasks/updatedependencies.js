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
 * @param {String} options.version Target version or a range version to which all eligible dependencies will be updated.
 * Examples: `1.0.0`, `^1.0.0`, etc.
 * @param {Function} options.shouldUpdateVersionCallback Callback function that decides whether to update a version for a dependency.
 * It receives a package name as an argument and should return a boolean value.
 * @param {String} [options.packagesDirectory] Relative path to a location of packages to update their dependencies. If not specified,
 * only the root package is checked.
 * @param {String} [options.cwd=process.cwd()] Current working directory from which all paths will be resolved.
 * @returns {Promise<Void>}
 */
module.exports = async function updateDependencies( options ) {
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

		const pkgJson = await fs.readJson( pkgJsonPath );

		updateVersion( version, shouldUpdateVersionCallback, pkgJson.dependencies );
		updateVersion( version, shouldUpdateVersionCallback, pkgJson.devDependencies );
		updateVersion( version, shouldUpdateVersionCallback, pkgJson.peerDependencies );

		await fs.writeJson( pkgJsonPath, pkgJson, { spaces: 2 } );
	}
};

/**
 * Updates the version for each eligible dependency.
 *
 * @param {String} version
 * @param {Function} callback
 * @param {Object} [dependencies]
 */
function updateVersion( version, callback, dependencies ) {
	if ( !dependencies ) {
		return;
	}

	for ( const packageName of Object.keys( dependencies ) ) {
		if ( callback( packageName ) ) {
			dependencies[ packageName ] = version;
		}
	}
}
