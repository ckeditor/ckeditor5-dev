/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );
const getPackageJson = require( './getpackagejson' );

/**
 * The function allows running a function on their locally installed dependencies.
 *
 * @param {Object} options
 * @param {String} options.cwd Current work directory.
 * @param {String} options.packages A relative path to the packages.
 * @param {Array.<String>} options.skipPackages Name of packages which won't be released.
 * @param {Function} functionToExecute A function that will be called on each package.
 * The function receives two arguments:
 *   * `{String} dependencyName Name of current package.`
 *   * `{String dependencyPath An absolute path to the package.`
 * The function may return a promise.
 * @returns {Promise.<Array.<String>>} Resolved promise returns an array with packages
 * which have been skipped.
 *
 * @TODO: This function should be removed. At this moment, the `tasks.releaseDependencies` uses it.
 * After removing the function, `releaseDependencies` should use:
 * - `getSubPackagesPaths()` or `getSubRepositoriesPaths()` for gathering the package paths,
 * - `executeOnPackages()` for executing custom function on these packages.
 */
module.exports = function executeOnDependencies( options, functionToExecute ) {
	const packagesAbsolutePath = path.join( options.cwd, options.packages );
	const directories = tools.getDirectories( packagesAbsolutePath );
	const skipPackagesList = options.skipPackages || [];
	const skippedPackageNames = [];

	let promise = Promise.resolve();

	if ( !directories.length ) {
		return promise;
	}

	const packageJson = getPackageJson( options.cwd );
	const dependencies = Object.keys( packageJson.dependencies || {} );

	for ( const directory of directories ) {
		const dependencyPath = path.join( packagesAbsolutePath, directory );
		const dependencyName = getPackageJson( dependencyPath ).name;

		if ( !isValidPackage( dependencyName ) ) {
			skippedPackageNames.push( dependencyName );

			continue;
		}

		promise = promise.then( () => {
			return functionToExecute( dependencyName, dependencyPath );
		} );
	}

	return promise.then( () => Promise.resolve( skippedPackageNames ) );

	function isValidPackage( dependencyName ) {
		// If the package is not specified in `package.json` - ignore them.
		if ( !dependencies.includes( dependencyName ) ) {
			return false;
		}

		// If the package should not be released - ignore them.
		if ( skipPackagesList.includes( dependencyName ) ) {
			return false;
		}

		return true;
	}
};
