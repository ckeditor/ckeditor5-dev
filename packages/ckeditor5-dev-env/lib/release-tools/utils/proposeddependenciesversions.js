/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const getCurrentVersion = require( './getcurrentversion' );
const getNewReleaseType = require( './getnewreleasetype' );
const getNextVersion = require( './getnextversion' );
const executeOnDependencies = require( './executeondependencies' );

/**
 * Returns an object with proposed new version of the dependencies.
 *
 * @param {Object} options
 * @params {String} options.cwd Current work directory.
 * @params {String} options.workspace A relative path to the workspace.
 * @returns {Promise}
 */
module.exports = function proposedDependenciesVersions( options ) {
	const versions = {};

	const execOptions = {
		cwd: options.cwd,
		workspace: options.workspace
	};

	const functionToExecute = ( repositoryName, repositoryPath ) => {
		process.chdir( repositoryPath );

		const currentVersion = getCurrentVersion();

		return getNewReleaseType().then( ( response ) => {
			versions[ repositoryName ] = getNextVersion( currentVersion, response.releaseType );
		} );
	};

	return executeOnDependencies( execOptions, functionToExecute )
		.then( () => {
			process.chdir( options.cwd );

			return Promise.resolve( versions );
		} );
};
