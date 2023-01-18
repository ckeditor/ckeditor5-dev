/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/**
 * The function allows running a function on locally installed packages.
 *
 * @param {Iterable} pathsToPackages A collection of paths to packages.
 * @param {Function} functionToExecute A function that will be called on each package.
 * The function receives one argument:
 *   * `{String} dependencyPath An absolute path to the package.`
 * The function should return a promise.
 * @returns {Promise}
 */
module.exports = function executeOnPackages( pathsToPackages, functionToExecute ) {
	let promise = Promise.resolve();

	for ( const pathToSinglePackage of pathsToPackages ) {
		promise = promise.then( () => functionToExecute( pathToSinglePackage ) );
	}

	return promise;
};
