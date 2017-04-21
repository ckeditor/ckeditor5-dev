/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { logger } = require( '@ckeditor/ckeditor5-dev-utils' );
const executeOnDependencies = require( '../utils/executeondependencies' );
const getPackagesToRelease = require( '../utils/getpackagestorelease' );
const validator = require( '../utils/releasevalidator' );
const cli = require( '../utils/cli' );
const createReleaseForSubRepository = require( './createreleaseforsubrepository' );

const BREAK_RELEASE_MESSAGE = 'Creating release has been aborted by the user.';

/**
 * Task releases the dependencies. It collects packages that will be release,
 * validates whether the packages can be released and gather required data from the user.
 *
 * @param {Object} options
 * @param {String} options.cwd Current working directory (packages) from which all paths will be resolved.
 * @param {String} options.packages Where to look for other packages (dependencies).
 * @param {Array.<String>} options.skipPackages Name of packages which won't be released.
 * @returns {Promise}
 */
module.exports = function releaseSubRepositories( options ) {
	const log = logger();

	const execOptions = {
		cwd: options.cwd,
		packages: options.packages,
		skipPackages: options.skipPackages || []
	};

	// Errors are added to this array by the `validatePackages` function.
	const errors = [];

	return getPackagesToRelease( execOptions )
		.then( ( dependencies ) => {
			options.dependencies = dependencies;

			if ( dependencies.size === 0 ) {
				throw new Error( 'None of the packages contains any changes since its last release. Aborting.' );
			}

			return cli.confirmRelease( dependencies );
		} )
		.then( ( isConfirmed ) => {
			if ( !isConfirmed ) {
				throw new Error( BREAK_RELEASE_MESSAGE );
			}

			return executeOnDependencies( execOptions, validatePackages );
		} )
		.then( () => {
			if ( errors.length ) {
				throw new Error( 'Releasing has been aborted due to errors.' );
			}

			return cli.configureReleaseOptions();
		} )
		.then( ( parsedOptions ) => {
			options.token = parsedOptions.token;
			options.skipGithub = parsedOptions.skipGithub;
			options.skipNpm = parsedOptions.skipNpm;

			return executeOnDependencies( execOptions, releaseSinglePackage );
		} )
		.then( () => process.chdir( options.cwd ) )
		.catch( ( err ) => {
			// A user did not confirm the release process.
			if ( err instanceof Error && err.message === BREAK_RELEASE_MESSAGE ) {
				return Promise.resolve();
			}

			log.error( err.message );
			errors.forEach( log.error.bind( log ) );

			process.exitCode = -1;
		} );

	function releaseSinglePackage( repositoryName, repositoryPath ) {
		if ( !options.dependencies.has( repositoryName ) ) {
			return Promise.resolve();
		}

		process.chdir( repositoryPath );

		return createReleaseForSubRepository( {
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
};
