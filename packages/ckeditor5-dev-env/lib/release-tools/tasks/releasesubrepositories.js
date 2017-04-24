/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { logger } = require( '@ckeditor/ckeditor5-dev-utils' );
const executeOnPackages = require( '../utils/executeonpackages' );
const getPackagesToRelease = require( '../utils/getpackagestorelease' );
const validator = require( '../utils/releasevalidator' );
const cli = require( '../utils/cli' );
const getSubRepositoriesPaths = require( '../utils/getsubrepositoriespaths' );
const createReleaseForSubRepository = require( './createreleaseforsubrepository' );
const displaySkippedPackages = require( '../utils/displayskippedpackages' );
const getPackageJson = require( '../utils/getpackagejson' );

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

	const pathsCollection = getSubRepositoriesPaths( {
		cwd: options.cwd,
		packages: options.packages,
		skipPackages: options.skipPackages || []
	} );

	// Errors are added to this array by the `validatePackages` function.
	const errors = [];

	return getPackagesToRelease( pathsCollection.packages )
		.then( ( dependencies ) => {
			displaySkippedPackages( pathsCollection.skipped );

			if ( dependencies.size === 0 ) {
				throw new Error( 'None of the packages contains any changes since its last release. Aborting.' );
			}

			options.dependencies = dependencies;

			// Filter out packages which won't be released.
			for ( const pathToPackage of pathsCollection.packages ) {
				const packageName = getPackageJson( pathToPackage ).name;

				if ( !dependencies.has( packageName ) ) {
					pathsCollection.packages.delete( pathToPackage );
				}
			}

			return cli.confirmRelease( dependencies );
		} )
		.then( ( isConfirmed ) => {
			if ( !isConfirmed ) {
				throw new Error( BREAK_RELEASE_MESSAGE );
			}

			return executeOnPackages( pathsCollection.packages, validatePackages );
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

			return executeOnPackages( pathsCollection.packages, releaseSinglePackage );
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
		process.chdir( repositoryPath );

		return createReleaseForSubRepository( {
			token: options.token,
			dependencies: options.dependencies,
			skipGithub: options.skipGithub,
			skipNpm: options.skipNpm
		} );
	}

	function validatePackages( repositoryName, repositoryPath ) {
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
