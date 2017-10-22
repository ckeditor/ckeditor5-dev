/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const { tools, logger } = require( '@ckeditor/ckeditor5-dev-utils' );
const cli = require( '../utils/cli' );
const displaySkippedPackages = require( '../utils/displayskippedpackages' );
const executeOnPackages = require( '../utils/executeonpackages' );
const getPackageJson = require( '../utils/getpackagejson' );
const getPackagesToRelease = require( '../utils/getpackagestorelease' );
const getSubRepositoriesPaths = require( '../utils/getsubrepositoriespaths' );
const releaseRepository = require( '../utils/releaserepository' );
const updateDependenciesVersions = require( '../utils/updatedependenciesversions' );
const validatePackageToRelease = require( '../utils/validatepackagetorelease' );

const BREAK_RELEASE_MESSAGE = 'Creating release has been aborted by the user.';

/**
 * Releases all sub repositories found in specified path.
 *
 * This task does:
 *   - finds paths to sub repositories,
 *   - filters packages which should be released,
 *   - updated version of dependencies between all released sub repositories (even if some packages will not be released),
 *   - generates changelog for packages that dependencies have changed,
 *   - collects required parameters for release from the user,
 *   - finally, releases the packages.
 *
 * @param {Object} options
 * @param {String} options.cwd Current working directory (packages) from which all paths will be resolved.
 * @param {String} options.packages Where to look for other packages (dependencies).
 * @param {Array.<String>} [options.skipPackages=[]] Name of packages which won't be released.
 * @returns {Promise}
 */
module.exports = function releaseSubRepositories( options ) {
	const cwd = process.cwd();
	const log = logger();

	const pathsCollection = getSubRepositoriesPaths( {
		cwd: options.cwd,
		packages: options.packages,
		skipPackages: options.skipPackages || []
	} );

	// These variables will be set during the function's execution.
	let packagesToRelease, dependencies;

	// Errors are added to this array by the `validateRepositories` function.
	const errors = [];

	return getPackagesToRelease( pathsCollection.packages )
		.then( packages => {
			packagesToRelease = packages;

			displaySkippedPackages( pathsCollection.skipped );

			if ( packagesToRelease.size === 0 ) {
				throw new Error( 'None of the packages contains any changes since its last release. Aborting.' );
			}

			return cli.confirmRelease( packagesToRelease )
				.then( isConfirmed => {
					if ( !isConfirmed ) {
						throw new Error( BREAK_RELEASE_MESSAGE );
					}
				} );
		} )
		.then( () => prepareDependenciesVersions() )
		.then( dependenciesWithVersions => {
			dependencies = dependenciesWithVersions;

			// Filter out packages which won't be released.
			for ( const pathToPackage of pathsCollection.packages ) {
				const packageName = getPackageJson( pathToPackage ).name;

				if ( !packagesToRelease.has( packageName ) ) {
					pathsCollection.packages.delete( pathToPackage );
				}
			}

			return updateDependenciesOfPackagesToRelease();
		} )
		.then( () => validateRepositories() )
		.then( () => {
			if ( errors.length ) {
				throw new Error( 'Releasing has been aborted due to errors.' );
			}

			return cli.configureReleaseOptions();
		} )
		.then( releaseOptions => releasePackages( releaseOptions ) )
		.then( () => process.chdir( cwd ) )
		.catch( err => {
			process.chdir( cwd );

			// A user did not confirm the release process.
			if ( err instanceof Error && err.message === BREAK_RELEASE_MESSAGE ) {
				log.info( 'Aborted due to user\'s no confirmation.' );

				return Promise.resolve();
			}

			log.error( err.message );
			errors.forEach( log.error.bind( log ) );

			process.exitCode = -1;
		} );

	function prepareDependenciesVersions() {
		const dependencies = new Map();

		for ( const [ packageName, { version } ] of packagesToRelease ) {
			dependencies.set( packageName, version );
		}

		for ( const packagePath of pathsCollection.skipped ) {
			const packageJson = getPackageJson( packagePath );

			dependencies.set( packageJson.name, packageJson.version );
		}

		for ( const packagePath of pathsCollection.packages ) {
			const packageJson = getPackageJson( packagePath );

			if ( !dependencies.has( packageJson.name ) ) {
				dependencies.set( packageJson.name, packageJson.version );
			}
		}

		return dependencies;
	}

	function updateDependenciesOfPackagesToRelease() {
		return executeOnPackages( pathsCollection.packages, repositoryPath => {
			process.chdir( repositoryPath );

			const packageJson = getPackageJson( repositoryPath );

			if ( !packagesToRelease.has( packageJson.name ) ) {
				return Promise.resolve();
			}

			updateDependenciesVersions( dependencies, path.join( repositoryPath, 'package.json' ) );

			if ( exec( 'git diff --name-only package.json' ).trim().length ) {
				log.info( `Updating dependencies for "${ packageJson.name }"...` );
				exec( 'git add package.json' );
				exec( 'git commit -m "Internal: Updated dependencies."' );
				exec( 'git pull && git push' );
			}

			return Promise.resolve();
		} );
	}

	function validateRepositories() {
		return executeOnPackages( pathsCollection.packages, repositoryPath => {
			process.chdir( repositoryPath );

			const packageJson = getPackageJson( repositoryPath );
			const releaseDetails = packagesToRelease.get( packageJson.name );
			const errorsForPackage = validatePackageToRelease( {
				changes: releaseDetails.changes,
				version: releaseDetails.version
			} );

			if ( errorsForPackage.length ) {
				errors.push( `## ${ packageJson.name }` );
				errors.push( ...errorsForPackage.map( err => '* ' + err ) );
			}

			return Promise.resolve();
		} );
	}

	function releasePackages( releaseOptions ) {
		return executeOnPackages( pathsCollection.packages, repositoryPath => {
			process.chdir( repositoryPath );

			const packageJson = getPackageJson( repositoryPath );
			const releaseDetails = packagesToRelease.get( packageJson.name );
			const releaseTaskOptions = {
				token: releaseOptions.token,
				skipGithub: releaseOptions.skipGithub,
				skipNpm: releaseOptions.skipNpm,
				version: releaseDetails.version,
				changes: releaseDetails.changes
			};

			return releaseRepository( releaseTaskOptions )
				.catch( err => {
					const packageName = getPackageJson().name;

					log.error( `## ${ packageName }` );
					log.error( err.message );

					process.exitCode = -1;
				} );
		} );
	}

	function exec( command ) {
		return tools.shExec( command, { verbosity: 'error' } );
	}
};
