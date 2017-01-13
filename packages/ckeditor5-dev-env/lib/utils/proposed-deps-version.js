/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const changelogUtils = require( './changelog' );
const execOnDependencies = require( './exec-on-dependencies' );

/**
 * Returns an object with proposed new version of the dependencies.
 *
 * @param {Object} options
 * @params {String} options.cwd Current work directory.
 * @params {String} options.workspace A relative path to the workspace.
 * @returns {Promise}
 */
module.exports = function proposedDepsVersions( options ) {
	const versions = {};

	const execOptions = {
		cwd: options.cwd,
		workspace: options.workspace
	};

	const functionToExecute = ( repositoryName, repositoryPath ) => {
		process.chdir( repositoryPath );

		const currentVersion = changelogUtils.getCurrentVersion();

		return changelogUtils.getNewReleaseType()
			.then( ( response ) => {
				versions[ repositoryName ] = changelogUtils.getNextVersion( currentVersion, response.releaseType );
			} );
	};

	const done = () => {
		return Promise.resolve( versions );
	};

	return execOnDependencies( execOptions, functionToExecute, done );
};
