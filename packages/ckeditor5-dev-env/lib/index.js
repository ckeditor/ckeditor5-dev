/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const executeOnDependencies = require( './release-tools/utils/executeondependencies' );

const tasks = {
	generateChangelog: require( './release-tools/tasks/generatechangelog' ),

	createRelease: require( './release-tools/tasks/createrelease' ),

	/**
	 * Generates the changelog for dependencies.
	 *
	 * @param {Options} options
	 * @returns {Promise}
	 */
	generateChangelogForDependencies( options ) {
		const execOptions = {
			cwd: options.cwd,
			packages: options.packages
		};

		const functionToExecute = ( repositoryName, repositoryPath ) => {
			process.chdir( repositoryPath );

			return tasks.generateChangelog();
		};

		return executeOnDependencies( execOptions, functionToExecute )
			.then( () => {
				process.chdir( options.cwd );
			} );
	},

	/**
	 * Generates the changelog for dependencies.
	 *
	 * @param {Options} options
	 * @returns {Promise}
	 */
	releaseDependencies( options ) {
		const execOptions = {
			cwd: options.cwd,
			packages: options.packages
		};

		const releaseSinglePackage = ( repositoryName, repositoryPath ) => {
			if ( !options.dependencies.has( repositoryName ) ) {
				return Promise.resolve();
			}

			process.chdir( repositoryPath );

			return tasks.createRelease( {
				token: options.token,
				dependencies: options.dependencies,
				skipGithub: options.skipGithub,
				skipNpm: options.skipNpm
			} );
		};

		const validatePackages = ( repositoryName, repositoryPath ) => {
			if ( !options.dependencies.has( repositoryName ) ) {
				return Promise.resolve();
			}

			process.chdir( repositoryPath );

			// todo: validate process.

			return Promise.resolve();
		};

		return executeOnDependencies( execOptions, validatePackages )
			.then( () => {
				// Whether to release on NPM, GH (and provide token)

				return Promise.resolve();
			} )
			.then( () => executeOnDependencies( execOptions, releaseSinglePackage ) )
			.then( () => {
				process.chdir( options.cwd );
			} );
	}
};

module.exports = tasks;
