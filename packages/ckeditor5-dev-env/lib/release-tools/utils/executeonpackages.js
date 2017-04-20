/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const getPackageJson = require( './getpackagejson' );

/**
 * The function allows running a function on locally installed packages.
 *
 * @param {Set} pathsToPackages A collection of paths to packages.
 * @param {Function} functionToExecute A function that will be called on each package.
 * The function receives two arguments:
 *   * `{String} dependencyName Name of current package.`
 *   * `{String dependencyPath An absolute path to the package.`
 * The function should return a promise.
 * @returns {Promise}
 */
module.exports = function executeOnPackages( pathsToPackages, functionToExecute ) {
	let promise = Promise.resolve();

	if ( !pathsToPackages.size ) {
		return promise;
	}

	for ( const pathToSinglePackage of pathsToPackages ) {
		const dependencyName = getPackageJson( pathToSinglePackage ).name;

		promise = promise.then( () => functionToExecute( dependencyName, pathToSinglePackage ) );
	}

	return promise;
};
