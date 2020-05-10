/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const fs = require( 'fs' );
const { Readable } = require( 'stream' );

const { stream, logger } = require( '@ckeditor/ckeditor5-dev-utils' );
const chalk = require( 'chalk' );
const semver = require( 'semver' );
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

const getCommits = require( '../utils/getcommits' );

const { typesOrder } = require( '../utils/transform-commit/transform-commit-utils' );
const conventionalChangelogWriter = require( 'conventional-changelog-writer' );

/**
 * Generates the changelog for the mono repository.
 *
 * @param {Object} options
 * @param {String} options.cwd Current working directory (packages) from which all paths will be resolved.
 * @param {String} options.packages Where to look for other packages.
 * @param {Function} options.transformScope A function that returns a URL to a package from a scope of a commit.
 * @param {String} [options.scope] Package names have to match to specified glob pattern in order to be processed.
 * @param {Array.<String>} [options.skipPackages=[]] Name of packages which won't be touched.
 * @param {String} [options.from] A commit or tag name that will be the first param of the range of commits to collect.
 * @returns {Promise.<SummaryChangelogResponse>}
 */
module.exports = function generateChangelogForSubRepositories( options ) {
	const log = logger();
	const cwd = process.cwd();
	const pkgJson = getPackageJson();

	const transformCommit = transformCommitForSubRepositoryFactory( {
		useExplicitBreakingChangeGroups: true
	} );

	const pathsCollection = getSubRepositoriesPaths( {
		cwd: options.cwd,
		packages: options.packages,
		scope: options.scope || null,
		skipPackages: options.skipPackages || [],
		skipMainRepository: true
	} );

	// The main repository should be at the end of the list.
	pathsCollection.skipped.delete( options.cwd );
	pathsCollection.matched.add( options.cwd );

	logProcess( 'Collecting all commits since the last release...' );

	// Collection of all entries (real commits + additional "fake" commits extracted from descriptions).
	let allCommits;

	// Whether the next release will be bumped as "major" release.
	// It depends on commits. If there is any of them that contains a "MAJOR BREAKING CHANGES" note,
	// all packages must be released as a major change.
	let willBeMajorBump = false;

	// If the next release will be the major bump, this variable will contain next version for all packages.
	let nextVersion = null;

	// Packages which during typing the new versions, the user proposed "skip" version.
	const skippedChangelogs = new Set();

	// A map: packages and their new versions.
	const packagesVersion = new Map();

	const commitOptions = {
		from: options.from ? options.from : 'v' + pkgJson.version
	};

	return getCommits( transformCommit, commitOptions )
		.then( commits => {
			allCommits = commits;

			logInfo( `Found ${ commits.length } entries to parse.`, { indentLevel: 1 } );
		} )
		.then( () => confirmMajorVersionBump() )
		.then( () => typeNewProposalVersionForAllPackages() )
		.then( () => confirmVersionForPackages() )
		.then( () => findPackagesWithInternalBumps() )
		.then( () => {
			logProcess( 'Generating the changelog' );

			const commitStream = new Readable( {
				objectMode: true
			} );
			commitStream._read = function() {};

			const version = packagesVersion.get( pkgJson.name );

			const writerContext = {
				version,
				repoUrl: pkgJson.repository.url.replace( /\.git$/, '' ),
				currentTag: 'v' + version,
				previousTag: 'v' + pkgJson.version,
				isPatch: semver.diff( version, pkgJson.version ) === 'patch',
				commit: 'commit'
			};

			const writerOptions = {
				groupBy: 'type',
				commitGroupsSort( a, b ) {
					return typesOrder[ a.title ] - typesOrder[ b.title ];
				},
				commitsSort: [ 'scope' ],
				noteGroupsSort( a, b ) {
					return typesOrder[ a.title ] - typesOrder[ b.title ];
				},
				notesSort: require( 'compare-func' ),
				mainTemplate: getTemplateFile( 'template.hbs' ),
				headerPartial: getTemplateFile( 'header.hbs' ),
				commitPartial: getTemplateFile( 'commit.hbs' ),
				footerPartial: getTemplateFile( 'footer.hbs' ),
				transform: {
					// We do not allow modifying the hash value by the generator itself.
					hash: hash => hash
				}
			};

			const publicCommits = [ ...allCommits ].filter( commit => commit.isPublicCommit )
				.map( commit => {
					commit.scope = commit.scope.map( name => {
						return `[${ name }](${ options.transformScope( name ) })`;
					} );

					return commit;
				} );

			for ( const commit of publicCommits ) {
				commitStream.push( commit );
			}

			commitStream.push( null );

			return new Promise( ( resolve, reject ) => {
				commitStream
					.pipe( conventionalChangelogWriter( writerContext, writerOptions ) )
					.pipe( stream.noop( changes => {
						console.log( changes.toString() );

						resolve();
					} ) )
					.on( 'error', reject );
			} );
		} )
		.then( () => {
			logProcess( 'Summary' );

			process.chdir( cwd );

			// An empty line increases the readability.
			log.info( '' );

			// displaySkippedPackages( new Set( [
			// 	...pathsCollection.skipped,
			// 	...skippedChangelogs
			// ].sort() ) );

			// An empty line between two lists increases the readability.
			log.info( '' );

			displayGeneratedChangelogs( packagesVersion );
		} )
		.catch( err => {
			console.log( err );
		} );

	/**
	 * Asks the user whether found "MAJOR BREAKING CHANGES" commits are true.
	 *
	 * @returns {Promise}
	 */
	function confirmMajorVersionBump() {
		logProcess( 'Looking for "MAJOR BREAKING CHANGES" commits...' );

		let hasMajorBreakingChanges = false;

		const majorBreakingChangesCommits = filterMajorBreakingChangesCommits( allCommits );

		if ( majorBreakingChangesCommits.size ) {
			hasMajorBreakingChanges = true;

			log.info( `\n${ ' '.repeat( cli.INDENT_SIZE ) }Found ${ chalk.bold( 'MAJOR BREAKING CHANGES') }:` );
			displayCommits( majorBreakingChangesCommits, { attachLinkToCommit: true, indentLevel: 2 } );
		}

		if ( !hasMajorBreakingChanges ) {
			console.log( chalk.italic(
				' '.repeat( cli.INDENT_SIZE ) +
				'Not found any "MAJOR BREAKING CHANGES" commit but you can decide whether a next release should be treated as a major.'
			) );
		}

		return cli.confirmMajorBreakingChangeRelease( hasMajorBreakingChanges, { indentLevel: 1 } )
			.then( result => {
				willBeMajorBump = result;
			} );
	}

	/**
	 * If the next release will be the major release, the user needs to provide the version which will be used
	 * as the proposal version for all packages.
	 *
	 * @returns {Promise}
	 */
	function typeNewProposalVersionForAllPackages() {
		if ( !willBeMajorBump ) {
			return Promise.resolve();
		}

		logProcess( 'Looking for the highest version in all packages...' );

		const [ packageHighestVersion, highestVersion ] = [ ...pathsCollection.matched ]
			.reduce( ( currentHighest, repositoryPath ) => {
				const packageJson = getPackageJson( repositoryPath );

				if ( semver.gt( packageJson.version, currentHighest[ 1 ] ) ) {
					return [ packageJson.name, packageJson.version ];
				}

				return currentHighest;
			}, [ null, '0.0.0' ] );

		return cli.provideNewMajorReleaseVersion( highestVersion, packageHighestVersion, { indentLevel: 1 } )
			.then( version => {
				nextVersion = version;
			} );
	}

	/**
	 * Asks the user about new versions for all packages.
	 *
	 * @returns {Promise}
	 */
	function confirmVersionForPackages() {
		logProcess( 'Preparing new version for all packages...' );

		let promise = Promise.resolve();

		for ( const packagePath of pathsCollection.matched ) {
			promise = promise.then( () => {
				const pkgJson = getPackageJson( packagePath );

				logInfo( `Processing "${ chalk.underline( pkgJson.name ) }"...`, { indentLevel: 1, startWithNewLine: true } );

				const packageCommits = filterCommitsByPath( packagePath );
				const releaseTypeOrVersion = willBeMajorBump ? nextVersion : getNewVersionType( packageCommits );

				displayCommits( packageCommits, { indentLevel: 2 } );

				return cli.provideVersion( pkgJson.version, releaseTypeOrVersion, { indentLevel: 2 } )
					.then( version => {
						if ( version === 'skip' ) {
							console.log( 'Skipping', packagePath );
							skippedChangelogs.add( packagePath );

							return Promise.resolve();
						}

						// If the user provided "internal" as a new version, we treat it as a "patch" bump.
						if ( version === 'internal' ) {
							version = semver.inc( pkgJson.version, 'patch' );
						}

						packagesVersion.set( pkgJson.name, version );
					} );
			} );
		}

		return promise;
	}

	/**
	 * Finds packages that were skipped or didn't have any committed changes.
	 *
	 * For such packages we want to bump the "patch" version.
	 * Unless, there should be a major bump.
	 *
	 * @returns {Promise}
	 */
	function findPackagesWithInternalBumps() {
		logProcess( 'Checking whether dependencies of skipped packages have changed...' );

		let clearRun = false;

		while ( !clearRun ) {
			clearRun = true;

			for ( const packagePath of skippedChangelogs ) {
				const pkgJson = getPackageJson( packagePath );

				// Check whether the dependencies of the current processing package will be released.
				const willUpdateDependencies = Object.keys( pkgJson.dependencies || {} )
					.some( dependencyName => packagesVersion.has( dependencyName ) );

				// If so, bump the version for current package and release it too.
				// The bump can be specified as `major` or `patch`. It depends whether we had the "MAJOR BREAKING CHANGES" commit.
				if ( willUpdateDependencies ) {
					const version = willBeMajorBump ? nextVersion : semver.inc( pkgJson.version, 'patch' );

					packagesVersion.set( pkgJson.name, version );
					skippedChangelogs.delete( packagePath );
					clearRun = false;
				}
			}
		}
	}

	/**
	 * Finds commits that contain a "MAJOR BREAKING CHANGES" note.
	 *
	 * @returns {Set.<Commit>}
	 */
	function filterMajorBreakingChangesCommits() {
		const breakingChangesCommits = allCommits
			.filter( commit => {
				if ( !commit.isPublicCommit ) {
					return false;
				}

				for ( const note of commit.notes ) {
					if ( note.title === 'MAJOR BREAKING CHANGES' ) {
						return true;
					}
				}

				return false;
			} );

		return new Set( breakingChangesCommits );
	}

	/**
	 * Finds commits that touched the package under `packagePath` directory.
	 *
	 * @param {String} packagePath
	 * @returns {Array.<Commit>}
	 */
	function filterCommitsByPath( packagePath ) {
		const shortPackagePath = packagePath.replace( options.cwd, '' )
			.replace( new RegExp( `^\\${ path.sep }` ), '' );

		return allCommits.filter( commit => {
			return commit.files.some( file => {
				// The main repository.
				if ( shortPackagePath === '' ) {
					return !file.startsWith( 'packages' );
				}

				return file.startsWith( shortPackagePath );
			} );
		} );
	}

	/**
	 * Proposes new version based on commits.
	 *
	 * @param {Array.<Commit>} commits
	 * @returns {String}
	 */
	function getNewVersionType( commits ) {
		// Repository does not have new changes.
		if ( !commits.length ) {
			return 'skip';
		}

		const publicCommits = commits.filter( commit => commit.isPublicCommit );

		if ( !publicCommits.length ) {
			return 'internal';
		}

		let newFeatures = false;
		let minorBreakingChanges = false;

		for ( const commit of publicCommits ) {
			for ( const note of commit.notes ) {
				if ( note.title === 'MAJOR BREAKING CHANGES' ) {
					return 'major';
				}

				if ( note.title === 'MINOR BREAKING CHANGES' ) {
					minorBreakingChanges = true;
				}
			}

			if ( commit.rawType === 'Feature' ) {
				newFeatures = true;
			}
		}

		// Repository has new features or minor breaking changes.
		if ( minorBreakingChanges || newFeatures ) {
			return 'minor';
		}

		return 'patch';
	}

	/**
	 * @param {String} file
	 * @returns {String}
	 */
	function getTemplateFile( file ) {
		return fs.readFileSync(
			require.resolve( '@ckeditor/ckeditor5-dev-env/lib/release-tools/templates/' + file ), 'utf-8'
		);
	}

	function logProcess( message ) {
		log.info( '\n📍 ' + chalk.cyan( message ) );
	}

	function logInfo( message, options = {} ) {
		const indentLevel = options.indentLevel || 0;
		const startWithNewLine = options.startWithNewLine || false;

		log.info( `${ startWithNewLine ? '\n' : '' }${ ' '.repeat( indentLevel * cli.INDENT_SIZE ) }` + message );
	}
};

/**
 * @typedef {Object} SummaryChangelogResponse
 *
 * @property {Boolean} wasMajorRelease Determines whether generated changelogs were generated as a major breaking release.
 *
 * @property {String|null} version If `wasMajorRelease` is `true`, `version` contains a proposed version by a user.
 */
