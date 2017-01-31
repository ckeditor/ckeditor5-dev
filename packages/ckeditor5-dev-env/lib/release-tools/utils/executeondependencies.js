/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const { workspace: workspaceUtils } = require( '@ckeditor/ckeditor5-dev-utils' );

/**
 * The function allows running a function on their locally installed dependencies.
 *
 * @param {Object} options
 * @param {String} options.cwd Current work directory.
 * @param {String} options.packages A relative path to the packages.
 * @param {Function} functionToExecute A function that will be called on each package.
 * The function receives two arguments:
 *   * `{String} dependencyName Name of current package.`
 *   * `{String dependencyPath An absolute path to the package.`
 * The function may return a promise.
 * @returns {Promise}
 */
module.exports = function executeOnDependencies( options, functionToExecute ) {
	const packagesAbsolutePath = path.join( options.cwd, options.packages );
	const directories = workspaceUtils.getDirectories( packagesAbsolutePath );

	let promise = Promise.resolve();

	if ( !directories.length ) {
		return promise;
	}

	for ( const directory of directories ) {
		const dependencyPath = path.join( packagesAbsolutePath, directory );
		const dependencyName = require( path.join( dependencyPath, 'package.json' ) ).name;

		promise = promise.then( () => {
			return functionToExecute( dependencyName, dependencyPath );
		} );
	}

	return promise;
};
