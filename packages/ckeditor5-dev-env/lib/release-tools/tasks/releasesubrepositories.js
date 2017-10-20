/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const { tools, logger } = require( '@ckeditor/ckeditor5-dev-utils' );
const parseGithubUrl = require( 'parse-github-url' );
const cli = require( '../utils/cli' );
const createGithubRelease = require( '../utils/creategithubrelease' );
const displaySkippedPackages = require( '../utils/displayskippedpackages' );
const executeOnPackages = require( '../utils/executeonpackages' );
const generateChangelogForSinglePackage = require( './generatechangelogforsinglepackage' );
const getPackageJson = require( '../utils/getpackagejson' );
const getPackagesToRelease = require( '../utils/getpackagestorelease' );
const getSubRepositoriesPaths = require( '../utils/getsubrepositoriespaths' );
const updateDependenciesVersions = require( '../utils/updatedependenciesversions' );
const validatePackageToRelease = require( '../utils/validatepackagetorelease' );
const { getChangesForVersion } = require( '../utils/changelog' );

const BREAK_RELEASE_MESSAGE = 'You aborted publishing the release. Why? Oh why?!';

/**
 * Releases all sub repositories found in specified path.
 *
 * This task does:
 *   - finds paths to sub repositories,
 *   - filters packages which should be released,
 *   - updated version of dependencies between all released sub repositories (even if some packages will not be released),
 *   - generates changelog for packages that dependencies have changed,
 *   - bumps version of all packages,
 *   - publishes new version on NPM,
 *   - pushes new version to the remote repository,
 *   - creates a release which is displayed on "Releases" page on Gitub.
 *
 * Pushes are done at the end of the whole process because of Continues Integration. We need to publish all
 * packages on NPM before starting the CI testing. If we won't do it, CI will fail because it won't be able
 * to install packages which versions will match to specified in `package.json`.
 * See {@link https://github.com/ckeditor/ckeditor5-dev/issues/272}.
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
	// List of packages to release; packages and their versions; options provided by the user (CLI).
	let packagesToRelease, dependencies, releaseOptions;

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
		.then( () => generateChangelogForPackagesThatDependenciesHaveUpdated() )
		.then( () => validateRepositories() )
		.then( () => {
			if ( errors.length ) {
				throw new Error( 'Releasing has been aborted due to errors.' );
			}

			return cli.configureReleaseOptions()
				.then( resolvedReleaseOptions => {
					releaseOptions = resolvedReleaseOptions;
				} );
		} )
		.then( () => bumpVersion() )
		.then( () => releaseOnNpm() )
		.then( () => pushRepositories() )
		.then( () => releaseOnGithub() )
		.then( () => process.chdir( cwd ) )
		.catch( err => {
			process.chdir( cwd );

			// A user did not confirm the release process.
			if ( err instanceof Error && err.message === BREAK_RELEASE_MESSAGE ) {
				log.info( 'Releasing has been aborted.' );

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
				exec( 'git commit -m "Internal: Updated dependencies. [skip ci]"' );
			}

			return Promise.resolve();
		} );
	}

	function generateChangelogForPackagesThatDependenciesHaveUpdated() {
		return executeOnPackages( pathsCollection.packages, repositoryPath => {
			process.chdir( repositoryPath );

			const packageJson = getPackageJson( repositoryPath );
			const releaseDetails = packagesToRelease.get( packageJson.name );

			const hasChangelog = releaseDetails.hasChangelog;
			const version = releaseDetails.version;

			// This flag was required only for generating the changelog.
			delete releaseDetails.hasChangelog;

			if ( hasChangelog ) {
				releaseDetails.changes = getChangesForVersion( version, repositoryPath );

				return Promise.resolve();
			}

			return generateChangelogForSinglePackage( version )
				.then( () => {
					releaseDetails.changes = getChangesForVersion( version, repositoryPath );
				} );
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

	function bumpVersion() {
		return executeOnPackages( pathsCollection.packages, repositoryPath => {
			process.chdir( repositoryPath );

			const packageJson = getPackageJson( repositoryPath );
			const releaseDetails = packagesToRelease.get( packageJson.name );

			log.info( `Bumping version for "${ packageJson.name }"...` );
			exec( `npm version ${ releaseDetails.version } --message "Release: v${ releaseDetails.version }."` );

			return Promise.resolve();
		} );
	}

	function releaseOnNpm() {
		if ( releaseOptions.skipNpm ) {
			return Promise.resolve();
		}

		return executeOnPackages( pathsCollection.packages, repositoryPath => {
			process.chdir( repositoryPath );

			const packageJson = getPackageJson( repositoryPath );

			log.info( `Publishing on NPM "${ packageJson.name }"...` );
			exec( 'npm publish --access=public' );
		} );
	}

	function pushRepositories() {
		return executeOnPackages( pathsCollection.packages, repositoryPath => {
			process.chdir( repositoryPath );

			const packageJson = getPackageJson( repositoryPath );
			log.info( `Pushing a local repository into the remote for "${ packageJson.name }"...` );

			exec( 'git push' );

			return Promise.resolve();
		} );
	}

	function releaseOnGithub() {
		if ( releaseOptions.skipGithub ) {
			return Promise.resolve();
		}

		return executeOnPackages( pathsCollection.packages, repositoryPath => {
			process.chdir( repositoryPath );

			const packageJson = getPackageJson( repositoryPath );
			const releaseDetails = packagesToRelease.get( packageJson.name );

			log.info( `Creating a GitHub release for "${ packageJson.name }"...` );

			const repositoryInfo = parseGithubUrl(
				exec( 'git remote get-url origin --push' ).trim()
			);

			const githubReleaseOptions = {
				repositoryOwner: repositoryInfo.owner,
				repositoryName: repositoryInfo.name,
				version: `v${ releaseDetails.version }`,
				description: releaseDetails.changes
			};

			return createGithubRelease( releaseOptions.token, githubReleaseOptions )
				.then( () => {
					const url = `https://github.com/${ repositoryInfo.owner }/${ repositoryInfo.name }/releases/tag/v${ options.version }`;
					log.info( `Created the release: ${ url }` );

					return Promise.resolve();
				} );
		} );
	}

	function exec( command ) {
		return tools.shExec( command, { verbosity: 'error' } );
	}
};
