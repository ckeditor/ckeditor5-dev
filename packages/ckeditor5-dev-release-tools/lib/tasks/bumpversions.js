/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const chalk = require( 'chalk' );
const { tools, logger } = require( '@ckeditor/ckeditor5-dev-utils' );
const cli = require( '../utils/cli' );
const versions = require( '../utils/versions' );
const changelog = require( '../utils/changelog' );
const displaySkippedPackages = require( '../utils/displayskippedpackages' );
const executeOnPackages = require( '../utils/executeonpackages' );
const getPackageJson = require( '../utils/getpackagejson' );
const getPackagesToRelease = require( '../utils/getpackagestorelease' );
const getPackagesPaths = require( '../utils/getpackagespaths' );
const updateDependenciesVersions = require( '../utils/updatedependenciesversions' );
const validatePackageToRelease = require( '../utils/validatepackagetorelease' );

const BREAK_RELEASE_MESSAGE = 'You aborted updating versions. Why? Oh why?!';

/**
 * Updates version of all subpackages found in specified path.
 *
 * This task does:
 *   - finds paths to subpackages,
 *   - updates versions of all dependencies (even if some packages will not be released, its version will be updated in released packages),
 *   - bumps version of all packages.
 *
 * @param {String} options.cwd Current working directory (packages) from which all paths will be resolved.
 * @param {String|null} options.packages Where to look for other packages (dependencies). If `null`, only repository specified under
 * `options.cwd` will be used in the task.
 * @param {Array.<String>} [options.skipPackages=[]] Name of packages which won't be touched.
 * @param {Boolean} [options.dryRun=false] If set on true, all changes will be printed on the screen. Changes produced by commands like
 * `npm version` will be reverted. Every called command will be displayed.
 * @param {Boolean} [options.skipMainRepository=false] If set on true, package found in "cwd" will be skipped.
 * @param {String} [options.releaseBranch='master'] A name of the branch that should be used for releasing packages.
 * @param {String} [options.changelogDirectory] An absolute path to the directory where the `CHANGELOG.md` file is saved. If not specified,
 * the `options.cwd` value will be used instead.
 * @param {Boolean} [options.skipUpdatingDependencies=false] Whether to skip updating version of dependencies between updated packages.
 * @returns {Promise} A collection with packages that were updated.
 */
module.exports = async function bumpVersions( options ) {
	const cwd = process.cwd();
	const log = logger();

	const dryRun = Boolean( options.dryRun );

	const pathsCollection = getPackagesPaths( {
		cwd: options.cwd,
		packages: options.packages,
		skipPackages: options.skipPackages || [],
		skipMainRepository: options.skipMainRepository
	} );

	const changelogDirectory = options.changelogDirectory || options.cwd;

	const mainRepositoryVersion = versions.getLastFromChangelog( changelogDirectory );
	const mainChangelog = changelog.getChangesForVersion( mainRepositoryVersion, changelogDirectory );
	const releaseBranch = options.releaseBranch || 'master';

	logDryRun( '⚠️  DRY RUN mode ⚠️' );
	logDryRun( 'All changes made by this script will be reverted automatically.' );
	logProcess( 'Collecting packages which versions should be updated...' );

	// In order to avoid setting global variables, every function passes `packages` variable to another function.

	return getPackagesToRelease( pathsCollection.matched, { changes: mainChangelog, version: mainRepositoryVersion } )
		.then( packages => isAnythingForRelease( packages ) )
		.then( packages => confirmUpdate( packages ) )
		.then( packages => prepareDependenciesVersions( packages ) )
		.then( ( { packages, dependencies } ) => filterPackagesThatWillNotBeReleased( packages, dependencies ) )
		.then( ( { packages, dependencies } ) => updateDependenciesOfPackages( packages, dependencies ) )
		.then( packages => updateLatestChangesForMainRepository( packages, mainRepositoryVersion ) )
		.then( packages => validateRepository( packages ) )
		.then( packages => bumpVersion( packages ) )
		.then( () => {
			process.chdir( cwd );

			logProcess( `Finished updating versions of ${ chalk.underline( pathsCollection.matched.size ) } package(s).` );
			logDryRun( 'Because of the DRY RUN mode, nothing has been changed. All changes were reverted.' );

			return Promise.resolve( pathsCollection.matched );
		} )
		.catch( err => {
			process.chdir( cwd );

			// A user did not confirm the release process.
			if ( err instanceof Error && err.message === BREAK_RELEASE_MESSAGE ) {
				logProcess( 'Updating has been aborted.' );

				return Promise.resolve();
			}

			log.error( err.message );

			process.exitCode = -1;
		} );

	// Displays packages that won't match to specified criteria and checks whether there is at least one package
	// that should update its version.
	//
	// @params {Map.<String, ReleaseDetails>} packages
	// @returns {Map.<String, ReleaseDetails>}
	function isAnythingForRelease( packages ) {
		logProcess( 'Checking whether is there anything for updating...' );

		displaySkippedPackages( pathsCollection.skipped );

		if ( packages.size === 0 ) {
			throw new Error( 'None of the packages contains any changes since its last release. Aborting.' );
		}

		return packages;
	}

	// Asks a user whether the process should be continued.
	//
	// @params {Map.<String, ReleaseDetails>} packages
	// @returns {Promise.<Map.<String, ReleaseDetails>>}
	function confirmUpdate( packages ) {
		logProcess( 'Should we continue?' );

		return cli.confirmUpdatingVersions( packages )
			.then( isConfirmed => {
				if ( !isConfirmed ) {
					throw new Error( BREAK_RELEASE_MESSAGE );
				}

				return packages;
			} );
	}

	// Prepare a map that contains new versions of packages. It will be used for updating dependencies' version during the release.
	//
	// This map contains new versions of all packages that will be released and current version of all packages which won't match to
	// specified criteria or won't be released (no changes between current and previous release).
	//
	// @params {Map.<String, ReleaseDetails>} packages
	// @returns {Object}
	function prepareDependenciesVersions( packages ) {
		logProcess( 'Preparing to updating versions of dependencies...' );

		const dependencies = new Map();

		// For every package that will be released, save its name and the latest version.
		for ( const [ packageName, { version } ] of packages ) {
			dependencies.set( packageName, version );
		}

		// Packages which won't match to specified criteria won't be released but we want to update their
		// versions in packages where skipped packages are defined as dependencies.
		for ( const packagePath of pathsCollection.skipped ) {
			const packageJson = getPackageJson( packagePath );

			dependencies.set( packageJson.name, packageJson.version );
		}

		// Even if some packages match to specified criteria but won't be releases because of no changes,
		// we want to update their version in packages where they are defined as dependency.
		for ( const packagePath of pathsCollection.matched ) {
			const packageJson = getPackageJson( packagePath );

			if ( !dependencies.has( packageJson.name ) ) {
				dependencies.set( packageJson.name, packageJson.version );
			}
		}

		return { packages, dependencies };
	}

	// Filter out packages which won't be released.
	//
	// @params {Map.<String, ReleaseDetails>} packages
	// @params {Map} dependencies
	// @returns {Object}
	function filterPackagesThatWillNotBeReleased( packages, dependencies ) {
		logDryRun( 'Filtering out packages that will not be updated...' );

		for ( const pathToPackage of pathsCollection.matched ) {
			const packageName = getPackageJson( pathToPackage ).name;

			if ( !packages.has( packageName ) ) {
				pathsCollection.matched.delete( pathToPackage );
			}
		}

		return { packages, dependencies };
	}

	// Update versions of all dependencies.
	//
	// @params {Map.<String, ReleaseDetails>} packages
	// @params {Map} dependencies
	// @returns {Promise.<Map.<String, ReleaseDetails>>}
	function updateDependenciesOfPackages( packages, dependencies ) {
		if ( options.skipUpdatingDependencies ) {
			logProcess( 'Skipping updating dependencies...' );

			return Promise.resolve( packages );
		}

		logProcess( 'Updating dependencies for packages that will be released...' );
		let hasUpdatedAnyPackage = false;

		return executeOnPackages( pathsCollection.matched, repositoryPath => {
			process.chdir( repositoryPath );

			const packageJson = getPackageJson( repositoryPath );

			log.info( `\nUpdating dependencies for "${ chalk.underline( packageJson.name ) }"...` );

			updateDependenciesVersions( dependencies, path.join( repositoryPath, 'package.json' ) );

			if ( exec( 'git diff --name-only package.json' ).trim().length ) {
				if ( dryRun ) {
					logDryRun( 'These changes would be committed.' );

					log.info( chalk.grey( exec( 'git diff --word-diff package.json' ) ) );
					exec( 'git checkout package.json' );
				} else {
					hasUpdatedAnyPackage = true;

					exec( 'git add package.json' );
				}
			}

			return Promise.resolve();
		} ).then( () => {
			process.chdir( cwd );

			if ( hasUpdatedAnyPackage ) {
				exec( 'git commit -m "Internal: Updated dependencies. [skip ci]"' );
			}

			return packages;
		} );
	}

	// Gather descriptions of the release for all packages.
	//
	// @params {Map.<String, ReleaseDetails>} packages
	// @returns {<Map.<String, ReleaseDetails>}
	function updateLatestChangesForMainRepository( packages, changes ) {
		logProcess( 'Updating changes for the main repository...' );

		const packageJson = getPackageJson( options.cwd );
		const releaseDetails = packages.get( packageJson.name );

		releaseDetails.changes = changes;

		return packages;
	}

	// Validate the main repository.
	//
	// @params {Map.<String, ReleaseDetails>} packages
	// @returns {Map.<String, ReleaseDetails>}
	function validateRepository( packages ) {
		logProcess( 'Validating the main repository...' );

		const mainPackageJson = getPackageJson( options.cwd );
		const releaseDetails = packages.get( mainPackageJson.name );

		const errors = validatePackageToRelease( {
			branch: releaseBranch,
			changes: releaseDetails.changes,
			version: releaseDetails.version
		} );

		if ( errors.length ) {
			log.error( `‼️  ${ chalk.underline( mainPackageJson.name ) }` );
			errors.forEach( err => {
				log.error( '* ' + err );
			} );

			throw new Error( 'Updating has been aborted due to errors.' );
		}

		return packages;
	}

	// Updates versions of packages.
	//
	// @params {Map.<String, ReleaseDetails>} packages
	// @returns {Promise.<Map.<String, ReleaseDetails>>}
	function bumpVersion( packages ) {
		logProcess( 'Tagging new versions of packages...' );

		let numberOfCommitsBeforeVersioning;

		// Based on number of commits before and after executing `npm version`, we will be able to revert all changes
		// that have been done. It allows reverting changes done by npm `preversion` and/or `postversion` hooks.
		if ( dryRun ) {
			numberOfCommitsBeforeVersioning = Number( exec( 'git rev-list --count HEAD' ) );
		}

		return executeOnPackages( pathsCollection.matched, bumpVersionForSinglePackage )
			.then( () => {
				process.chdir( options.cwd );

				const packageJson = getPackageJson( options.cwd );
				const releaseDetails = packages.get( packageJson.name );

				log.info( '\nCommitting and tagging changes...' );

				exec( `git commit --message "Release: v${ releaseDetails.version }."` );
				exec( `git tag v${ releaseDetails.version }` );

				if ( dryRun ) {
					const numberOfCommitsAfterVersioning = Number( exec( 'git rev-list --count HEAD' ) );
					const commitsToRevert = numberOfCommitsAfterVersioning - numberOfCommitsBeforeVersioning;

					logDryRun( `Reverting changes made by "npm version". Removing a tag and ${ commitsToRevert } commit(s).` );
					exec( `git reset --hard HEAD~${ commitsToRevert }` );
					exec( `git tag -d v${ releaseDetails.version }` );
				}

				return packages;
			} );

		function bumpVersionForSinglePackage( repositoryPath ) {
			process.chdir( repositoryPath );

			const packageJson = getPackageJson( repositoryPath );
			const releaseDetails = packages.get( packageJson.name );

			log.info( `\nBumping version for "${ chalk.underline( packageJson.name ) }"...` );

			exec( `npm version ${ releaseDetails.version } --no-git-tag-version --no-workspaces-update` );
			exec( 'git add .' );
		}
	}

	function exec( command ) {
		if ( dryRun ) {
			log.info( `⚠️  ${ chalk.grey( 'Execute:' ) } "${ chalk.cyan( command ) }" in "${ chalk.grey.italic( process.cwd() ) }".` );
		}

		return tools.shExec( command, { verbosity: 'error' } );
	}

	function logProcess( message ) {
		log.info( '\n📍 ' + chalk.cyan( message ) );
	}

	function logDryRun( message ) {
		if ( dryRun ) {
			log.info( 'ℹ️  ' + chalk.yellow( message ) );
		}
	}
};
