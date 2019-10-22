/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { logger } = require( '@ckeditor/ckeditor5-dev-utils' );
const chalk = require( 'chalk' );
const cli = require( '../utils/cli' );
const displayCommits = require( '../utils/displaycommits' );
const displayGeneratedChangelogs = require( '../utils/displaygeneratedchangelogs' );
const displaySkippedPackages = require( '../utils/displayskippedpackages' );
const executeOnPackages = require( '../utils/executeonpackages' );
const generateChangelogForSinglePackage = require( './generatechangelogforsinglepackage' );
const getNewReleaseType = require( '../utils/getnewreleasetype' );
const getPackageJson = require( '../utils/getpackagejson' );
const getSubRepositoriesPaths = require( '../utils/getsubrepositoriespaths' );
const transformCommitForSubRepositoryFactory = require( '../utils/transform-commit/transformcommitforsubrepositoryfactory' );
const versionUtils = require( '../utils/versions' );

/**
 * Generates the changelog for packages located in multi repositories.
 *
 * @param {Object} options
 * @param {String} options.cwd Current working directory (packages) from which all paths will be resolved.
 * @param {String} options.packages Where to look for other packages.
 * @param {String} [options.scope] Package names have to match to specified glob pattern.
 * @param {Array.<String>} [options.skipPackages=[]] Name of packages which won't be touched.
 * @param {Boolean} [options.skipMainRepository=false] If set on true, package found in "cwd" will be skipped.
 * @returns {Promise}
 */
module.exports = function generateChangelogForSubRepositories( options ) {
	const log = logger();
	const cwd = process.cwd();

	const pathsCollection = getSubRepositoriesPaths( {
		cwd: options.cwd,
		packages: options.packages,
		scope: options.scope || null,
		skipPackages: options.skipPackages || [],
		skipMainRepository: options.skipMainRepository
	} );

	// Whether the next release will be bumped as "major" release.
	// It depends on commits. If there is any of them that contains a "MAJOR BREAKING CHANGES" note,
	// all packages must be released as a major change.
	let willBeMajorBump = false;

	const generatedChangelogsMap = new Map();
	const skippedChangelogs = new Set();

	return collectPackagesCommits()
		.then( packagesCommit => confirmMajorVersionBump( packagesCommit ) )
		.then( () => generateChangelogs() )
		.then( () => generateInternalChangelogs() )
		.then( () => {
			process.chdir( cwd );

			displaySkippedPackages( new Set( [
				...pathsCollection.skipped,
				...skippedChangelogs
			].sort() ) );

			displayGeneratedChangelogs( generatedChangelogsMap );

			log.info( 'Done.' );
		} );

	/**
	 * Creates a collection where:
	 * - keys are names of the packages,
	 * - their values are collections of the commits.
	 *
	 * @returns {Promise.<Map.<String, Set.<Commit>>>}
	 */
	function collectPackagesCommits() {
		logProcess( 'Collecting commits for packages since the last release...' );

		const packagesCommit = new Map();

		return executeOnPackages( pathsCollection.matched, repositoryPath => {
			process.chdir( repositoryPath );

			const packageJson = getPackageJson();

			let tagName = versionUtils.getLastFromChangelog();

			if ( tagName ) {
				tagName = 'v' + tagName;
			}

			return getNewReleaseType( transformCommitForSubRepositoryFactory(), { tagName } )
				.then( result => {
					packagesCommit.set( packageJson.name, new Set( result.commits ) );
				} );
		} ).then( () => packagesCommit );
	}

	/**
	 * Asks the user whether found "MAJOR BREAKING CHANGES" commits are true.
	 *
	 * @returns {Promise.<undefined>}
	 */
	function confirmMajorVersionBump( packagesCommit ) {
		logProcess( 'Looking for "MAJOR BREAKING CHANGES" commits...' );

		let hasMajorBreakingChanges = false;

		for ( const [ packageName, commits ] of packagesCommit ) {
			const majorBreakingChangesCommits = filterMajorBreakingChangesCommits( commits );

			if ( majorBreakingChangesCommits.size ) {
				hasMajorBreakingChanges = true;

				log.info( `\n🔸 Found in "${ chalk.underline( packageName ) }"...` );
				displayCommits( majorBreakingChangesCommits );
			}
		}

		return cli.confirmMajorBreakingChangeRelease( hasMajorBreakingChanges )
			.then( result => {
				willBeMajorBump = result;
			} );
	}

	/**
	 * Generates changelogs for packages.
	 *
	 * @returns {Promise}
	 */
	function generateChangelogs() {
		logProcess( 'Generating changelogs for packages...' );

		const newVersion = willBeMajorBump ? 'major' : null;

		return executeOnPackages( pathsCollection.matched, repositoryPath => {
			process.chdir( repositoryPath );

			return generateChangelogForSinglePackage( { newVersion, disableMajorBump: !willBeMajorBump } )
				.then( newVersionInChangelog => {
					if ( newVersionInChangelog ) {
						generatedChangelogsMap.set( getPackageJson( repositoryPath ).name, newVersionInChangelog );
					} else {
						skippedChangelogs.add( repositoryPath );
					}
				} )
				.catch( err => {
					log.error( err );
				} );
		} );
	}

	/**
	 * Generates changelogs for packages that were skipped or didn't have any committed changes.
	 *
	 * For such packages we are generating "internal" release that increases the "patch" version.
	 * Unless, there should be a major bump.
	 *
	 * @returns {Promise}
	 */
	function generateInternalChangelogs() {
		logProcess( 'Checking whether dependencies of skipped packages have changed...' );

		log.info( '\n' + chalk.underline( '' ) );

		const internalChangelogsPaths = new Map();
		const newVersion = willBeMajorBump ? 'major' : 'patch';
		let clearRun = false;

		while ( !clearRun ) {
			clearRun = true;

			for ( const packagePath of skippedChangelogs ) {
				const packageJson = getPackageJson( packagePath );

				// Check whether the dependencies of the current processing package will be released.
				const willUpdateDependencies = Object.keys( packageJson.dependencies || {} )
					.some( dependencyName => {
						return generatedChangelogsMap.has( dependencyName ) || internalChangelogsPaths.has( dependencyName );
					} );

				// If so, bump the version for current package and release it too.
				// The bump can be specified as `major` or `patch`. It depends whether we had the "MAJOR BREAKING CHANGES" commit.
				if ( willUpdateDependencies ) {
					internalChangelogsPaths.set( packageJson.name, packagePath );
					skippedChangelogs.delete( packagePath );
					clearRun = false;
				}
			}
		}

		return executeOnPackages( internalChangelogsPaths.values(), repositoryPath => {
			process.chdir( repositoryPath );

			return generateChangelogForSinglePackage( { newVersion, isInternalRelease: true } )
				.then( newVersion => {
					generatedChangelogsMap.set( getPackageJson( repositoryPath ).name, newVersion );
				} )
				.catch( err => {
					log.error( err );
				} );
		} );
	}

	/**
	 * Finds commits that contain a "MAJOR BREAKING CHANGES" note.
	 *
	 * @param {Set.<Commit>} commits
	 * @returns {Set.<Commit>}
	 */
	function filterMajorBreakingChangesCommits( commits ) {
		const breakingChangesCommits = [ ...commits ]
			.filter( commit => {
				for ( const note of commit.notes ) {
					if ( note.title === 'MAJOR BREAKING CHANGES' ) {
						return true;
					}
				}

				return false;
			} );

		return new Set( breakingChangesCommits );
	}

	function logProcess( message ) {
		log.info( '\n📍  ' + chalk.blue( message ) );
	}
};
