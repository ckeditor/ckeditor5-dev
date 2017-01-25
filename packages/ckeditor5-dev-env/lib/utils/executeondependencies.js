/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const { workspace } = require( '@ckeditor/ckeditor5-dev-utils' );

/**
 * The module allows running a function on their locally installed dependencies.
 *
 * @param {Object} options
 * @param {String} options.cwd Current work directory.
 * @param {String} options.workspace A relative path to the workspace.
 * @param {Function} functionToExecute A function that will be called on each package.
 * The function receives two arguments:
 *   - `{String} dependencyName Name of current package.`
 *   - `{String dependencyPath An absolute path to the package.`
 * The functions should return an instance of Promise.
 * @param {Function|null} done A function that will be called after the whole process.
 * @returns {Promise}
 */
module.exports = function executeOnDependencies( options, functionToExecute, done = null ) {
	const workspaceAbsolutePath = path.join( options.cwd, options.workspace );
	const directories = workspace.getDirectories( workspaceAbsolutePath );

	let promise = Promise.resolve();

	if ( !directories.length ) {
		return promise;
	}

	for ( const directory of directories ) {
		const dependencyPath = path.join( workspaceAbsolutePath, directory );
		const directoryPackageJson = require( path.join( dependencyPath, 'package.json' ) );
		const dependencyName = directoryPackageJson.name;

		promise = promise.then( () => {
			return functionToExecute( dependencyName, dependencyPath );
		} );
	}

	return promise.then( () => {
		if ( done ) {
			return done();
		}
	} );
};
