/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
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
 * @param {Function} taskToExecute A function that will be called on each package.
 * The function receives two arguments:
 *   - `{String} dependencyName Name of current package.`
 *   - `{String dependencyPath An absolute path to the package.`
 * @param {Function|null} done A function that will be called after the whole process.
 * @returns {Promise}
 */
module.exports = function execOnDependencies( options, taskToExecute, done = null ) {
	const packageJSON = require( path.join( options.cwd, 'package.json' ) );
	const workspaceAbsolutePath = path.join( options.cwd, options.workspace );

	let promise = Promise.resolve();

	// Get all dependencies from package.json.
	const dependencies = workspace.getDependencies( packageJSON.dependencies );

	if ( !dependencies ) {
		return promise;
	}

	const directories = workspace.getDirectories( workspaceAbsolutePath );

	if ( !directories.length ) {
		return promise;
	}

	for ( const dependencyName of Object.keys( dependencies ) ) {
		const dependencyPath = path.join( workspaceAbsolutePath, dependencyName );

		// Check if repository's directory already exists.
		if ( directories.indexOf( dependencyName ) > -1 ) {
			promise = promise.then( () => {
				return taskToExecute( dependencyName, dependencyPath );
			} );
		}
	}

	return promise.then( () => {
		process.chdir( options.cwd );

		if ( done ) {
			return done();
		}
	} );
};
