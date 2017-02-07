/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { logger } = require( '@ckeditor/ckeditor5-dev-utils' );
const executeOnDependencies = require( './release-tools/utils/executeondependencies' );
const packagesToRelease = require( './release-tools/utils/packagestorelease' );
const validator = require( './release-tools/utils/releasevalidator' );
const cli = require( './release-tools/utils/cli' );

const tasks = {
	generateChangelog: require( './release-tools/tasks/generatechangelog' ),

	createRelease: require( './release-tools/tasks/createrelease' ),

	/**
	 * Generates the changelog for dependencies.
	 *
	 * @param {Options} options
	 * @param {String} options.cwd Current working directory (packages) from which all paths will be resolved.
	 * @param {String} options.packages Where to look for other packages (dependencies).
	 * @returns {Promise}
	 */
	generateChangelogForDependencies( options ) {
		const execOptions = {
			cwd: options.cwd,
			packages: options.packages
		};

		const generateChangelogForSinglePackage = ( repositoryName, repositoryPath ) => {
			process.chdir( repositoryPath );

			return tasks.generateChangelog();
		};

		return executeOnDependencies( execOptions, generateChangelogForSinglePackage )
			.then( () => {
				process.chdir( options.cwd );
			} );
	},

	/**
	 * Task releases the dependencies. It collects packages that will be release,
	 * validates whether the packages can be released and gather required data from the user.
	 *
	 * @param {Object} options
	 * @param {String} options.cwd Current working directory (packages) from which all paths will be resolved.
	 * @param {String} options.packages Where to look for other packages (dependencies).
	 * @returns {Promise}
	 */
	releaseDependencies( options ) {
		const execOptions = {
			cwd: options.cwd,
			packages: options.packages
		};

		const errors = [];

		return packagesToRelease( execOptions )
			.then( ( dependencies ) => {
				options.dependencies = dependencies;

				return cli.configureReleaseOptions();
			} )
			.then( ( parsedOptions ) => {
				options.token = parsedOptions.token;
				options.skipGithub = parsedOptions.skipGithub;
				options.skipNpm = parsedOptions.skipNpm;

				return executeOnDependencies( execOptions, validatePackages );
			} )
			.then( () => {
				if ( errors.length ) {
					const log = logger();

					log.error( 'The errors occur during release process.' );
					errors.forEach( log.error.bind( log ) );

					return Promise.reject();
				}

				return executeOnDependencies( execOptions, releaseSinglePackage );
			} )
			.then( () => process.chdir( options.cwd ) );

		function releaseSinglePackage( repositoryName, repositoryPath ) {
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
		}

		function validatePackages( repositoryName, repositoryPath ) {
			if ( !options.dependencies.has( repositoryName ) ) {
				return Promise.resolve();
			}

			process.chdir( repositoryPath );

			try {
				validator.checkBranch();
			} catch ( err ) {
				errors.push( `## ${ repositoryName }` );
				errors.push( err.message );
			}

			return Promise.resolve();
		}
	}
};

module.exports = tasks;
