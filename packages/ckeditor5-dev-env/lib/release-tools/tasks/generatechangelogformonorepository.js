/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const { Readable } = require( 'stream' );
const compareFunc = require( 'compare-func' );
const { tools, stream, logger } = require( '@ckeditor/ckeditor5-dev-utils' );
const conventionalChangelogWriter = require( 'conventional-changelog-writer' );
const chalk = require( 'chalk' );
const minimatch = require( 'minimatch' );
const semver = require( 'semver' );
const changelogUtils = require( '../utils/changelog' );
const cli = require( '../utils/cli' );
const displayCommits = require( '../utils/displaycommits' );
const displaySkippedPackages = require( '../utils/displayskippedpackages' );
const getPackageJson = require( '../utils/getpackagejson' );
const getNewVersionType = require( '../utils/getnewversiontype' );
const getSubRepositoriesPaths = require( '../utils/getsubrepositoriespaths' );
const getCommits = require( '../utils/getcommits' );
const getWriterOptions = require( '../utils/transform-commit/getwriteroptions' );
const { getRepositoryUrl } = require( '../utils/transform-commit/transform-commit-utils' );
const transformCommitForSubRepositoryFactory = require( '../utils/transform-commit/transformcommitforsubrepositoryfactory' );

const VERSIONING_POLICY_URL = 'https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html';
const noteInfo = `[ℹ️](${ VERSIONING_POLICY_URL }#major-and-minor-breaking-changes)`;

/**
 * Generates the changelog for the mono repository.
 *
 * @param {Object} options
 * @param {String} options.cwd Current working directory (packages) from which all paths will be resolved.
 * @param {String} options.packages Where to look for packages.
 * @param {Function} options.transformScope A function that returns a URL to a package from a scope of a commit.
 * @param {String} [options.scope] Package names have to match to specified glob pattern in order to be processed.
 * @param {Array.<String>} [options.skipPackages=[]] Name of packages which won't be touched.
 * @param {String} [options.from] A commit or tag name that will be the first param of the range of commits to collect.
 * @param {Boolean} [options.highlightsPlaceholder=false] Whether to add a note about release highlights.
 * @param {Boolean} [options.collaborationFeatures=false] Whether to add a note about collaboration features.
 * @returns {Promise}
 */
module.exports = function generateChangelogForMonoRepository( options ) {
	const log = logger();
	const cwd = process.cwd();
	const pkgJson = getPackageJson( options.cwd );

	const transformCommit = transformCommitForSubRepositoryFactory( {
		useExplicitBreakingChangeGroups: true,
		returnInvalidCommit: true
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

	// Collection of public entries that will be inserted in the changelog.
	let publicCommits;

	// Whether the next release will be bumped as "major" release.
	// It depends on commits. If there is any of them that contains a "MAJOR BREAKING CHANGES" note,
	// all packages must be released as a major change.
	let willBeMajorBump = false;

	// If the next release will be the major bump, this variable will contain next version for all packages.
	let nextVersion = null;

	// Packages which during typing the new versions, the user proposed "skip" version.
	const skippedChangelogs = new Set();

	// A map contains packages and their new versions.
	const packagesVersion = new Map();

	// A map contains packages and their current versions.
	const currentPackagesVersion = new Map();

	// A map contains packages and their paths (where they are located)
	const packagesPaths = new Map();

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
		.then( () => generateChangelogFromCommits() )
		.then( changesFromCommits => saveChangelog( changesFromCommits ) )
		.then( () => {
			logProcess( 'Summary' );

			displaySkippedPackages( new Set( [
				...pathsCollection.skipped,
				...skippedChangelogs
			].sort() ) );

			// Make a commit from the repository where we started.
			process.chdir( options.cwd );
			tools.shExec( `git add ${ changelogUtils.changelogFile }`, { verbosity: 'error' } );
			tools.shExec( 'git commit -m "Docs: Changelog. [skip ci]"', { verbosity: 'error' } );

			logInfo(
				`Changelog for "${ chalk.underline( pkgJson.name ) }" (v${ packagesVersion.get( pkgJson.name ) }) has been generated.`,
				{ indentLevel: 1 }
			);

			process.chdir( cwd );
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

		const majorBreakingChangesCommits = filterCommitsByNoteTitle( allCommits, 'MAJOR BREAKING CHANGES' );
		const hasMajorBreakingChanges = majorBreakingChangesCommits.length > 0;

		if ( hasMajorBreakingChanges ) {
			logInfo( `Found ${ chalk.bold( 'MAJOR BREAKING CHANGES' ) }:`, { indentLevel: 1 } );
			displayCommits( majorBreakingChangesCommits, { attachLinkToCommit: true, indentLevel: 2 } );
		} else {
			logInfo( chalk.italic(
				'Not found any "MAJOR BREAKING CHANGES" commit but you can decide whether a next release should be treated as a major.'
			), { indentLevel: 1 } );
		}

		return cli.confirmMajorBreakingChangeRelease( hasMajorBreakingChanges, { indentLevel: 1 } )
			.then( result => {
				willBeMajorBump = result;
			} );
	}

	/**
	 * Finds commits that contain a note which matches to `titleNote`.
	 *
	 * @returns {Array.<Commit>}
	 */
	function filterCommitsByNoteTitle( commits, titleNote ) {
		return commits.filter( commit => {
			if ( !commit.isPublicCommit ) {
				return false;
			}

			for ( const note of commit.notes ) {
				if ( note.title.startsWith( titleNote ) ) {
					return true;
				}
			}

			return false;
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

				currentPackagesVersion.set( packageJson.name, packageJson.version );

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

				packagesPaths.set( pkgJson.name, packagePath );
				currentPackagesVersion.set( pkgJson.name, pkgJson.version );

				logInfo( `Processing "${ chalk.underline( pkgJson.name ) }"...`, { indentLevel: 1, startWithNewLine: true } );

				const packageCommits = filterCommitsByPath( allCommits, packagePath );
				const releaseTypeOrVersion = willBeMajorBump ? nextVersion : getNewVersionType( packageCommits );

				displayCommits( packageCommits, { indentLevel: 2 } );

				return cli.provideVersion( pkgJson.version, releaseTypeOrVersion, { indentLevel: 2 } )
					.then( version => {
						if ( version === 'skip' ) {
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
	 * Finds commits that touched the package under `packagePath` directory.
	 *
	 * @param {Array.<Commit>} commits
	 * @param {String} packagePath
	 * @returns {Array.<Commit>}
	 */
	function filterCommitsByPath( commits, packagePath ) {
		const shortPackagePath = packagePath.replace( options.cwd, '' )
			.replace( new RegExp( `^\\${ path.sep }` ), '' );

		return commits.filter( commit => {
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
	 * Generates a list of changes based on the commits in the main repository.
	 *
	 * @returns {Promise.<String>}
	 */
	function generateChangelogFromCommits() {
		logProcess( 'Generating the changelog...' );

		const commitStream = new Readable( { objectMode: true } );
		commitStream._read = function() {};

		const version = packagesVersion.get( pkgJson.name );

		const writerContext = {
			version,
			commit: 'commit',
			repoUrl: getRepositoryUrl( options.cwd ),
			currentTag: 'v' + version,
			previousTag: 'v' + pkgJson.version,
			isPatch: semver.diff( version, pkgJson.version ) === 'patch',
			highlightsPlaceholder: options.highlightsPlaceholder || false,
			collaborationFeatures: options.collaborationFeatures || false
		};

		const writerOptions = getWriterOptions( {
			// We do not allow modifying the commit hash value by the generator itself.
			hash: hash => hash
		} );

		const sortFunction = compareFunc( item => {
			if ( Array.isArray( item.rawScope ) ) {
				// A hack that allows moving all scoped commits from the main repository/package at the beginning of the list.
				if ( item.rawScope[ 0 ] === pkgJson.name ) {
					return 'a'.repeat( 15 );
				}

				return item.rawScope[ 0 ];
			}

			// A hack that allows moving all non-scoped commits or breaking changes notes at the end of the list.
			return 'z'.repeat( 15 );
		} );

		writerOptions.commitsSort = sortFunction;
		writerOptions.notesSort = sortFunction;

		publicCommits = [ ...allCommits ]
			.filter( commit => commit.isPublicCommit )
			.map( commit => {
				commit.rawScope = commit.scope;

				// Transforms a scope to markdown link.
				if ( Array.isArray( commit.scope ) ) {
					commit.scope = commit.scope.map( scopeToLink );
				}

				// Attaches an icon to notes.
				commit.notes = commit.notes.map( note => {
					note.title += ' ' + noteInfo;
					note.rawScope = note.scope;

					// Transforms a scope to markdown link.
					if ( Array.isArray( note.scope ) ) {
						note.scope = note.scope.map( scopeToLink );
					}

					return note;
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
					logInfo( 'Changes based on commits have been generated.', { indentLevel: 1 } );
					resolve( changes.toString() );
				} ) )
				.on( 'error', reject );
		} );

		function scopeToLink( name ) {
			return `[${ name }](${ options.transformScope( name ) })`;
		}
	}

	/**
	 * Combines the generated changes based on commits and summary of version changes in packages.
	 * Appends those changes at the beginning of the changelog file.
	 *
	 * @param {String} changesFromCommits Generated entries based on commits.
	 */
	function saveChangelog( changesFromCommits ) {
		logProcess( 'Saving changelog...' );

		logInfo( 'Preparing a summary of version changes in packages.', { indentLevel: 1 } );

		const dependenciesSummary = generateSummaryOfChangesInPackages();

		let currentChangelog = changelogUtils.getChangelog();

		// Remove header from current changelog.
		currentChangelog = currentChangelog.replace( changelogUtils.changelogHeader, '' ).trim();

		// Concat header, new entries and old changelog to single string.
		let newChangelog = changelogUtils.changelogHeader +
			changesFromCommits.trim() +
			'\n\n' +
			dependenciesSummary +
			'\n\n\n' +
			currentChangelog;

		newChangelog = newChangelog.trim() + '\n';

		// Save the changelog.
		changelogUtils.saveChangelog( newChangelog );

		logInfo( 'Saved.', { indentLevel: 1 } );
	}

	/**
	 * Prepares a summary that describes what has changed in all dependencies.
	 *
	 * @returns {String}
	 */
	function generateSummaryOfChangesInPackages() {
		const dependencies = new Map();

		for ( const [ packageName, nextVersion ] of packagesVersion ) {
			// Skip the package hosted in the main repository.
			if ( packageName === pkgJson.name ) {
				continue;
			}

			dependencies.set( packageName, {
				next: nextVersion,
				current: currentPackagesVersion.get( packageName )
			} );
		}

		const newPackages = getNewPackages( dependencies );
		const majorBreakingChangesPackages = getPackagesMatchedToScopesFromNotes( dependencies, 'MAJOR BREAKING CHANGES' );
		const minorBreakingChangesPackages = getPackagesMatchedToScopesFromNotes( dependencies, 'MINOR BREAKING CHANGES' );
		const newFeaturesPackages = getPackagesWithNewFeatures( dependencies );

		const entries = [
			'### Released packages\n',
			`Check out the [Versioning policy](${ VERSIONING_POLICY_URL }) guide for more information.\n`,
			'<details><summary>Released packages (summary)</summary>'
		];

		if ( newPackages.size ) {
			entries.push( 'New packages:\n' );

			for ( const [ packageName, version ] of [ ...newPackages ].sort( sortByPackageName ) ) {
				entries.push( formatChangelogEntry( packageName, version.next ) );
			}

			entries.push( '' );
		}

		if ( majorBreakingChangesPackages.size ) {
			entries.push( 'Major releases (contain major breaking changes):\n' );

			for ( const [ packageName, version ] of [ ...majorBreakingChangesPackages ].sort( sortByPackageName ) ) {
				entries.push( formatChangelogEntry( packageName, version.next, version.current ) );
			}

			entries.push( '' );
		}

		if ( minorBreakingChangesPackages.size ) {
			entries.push( 'Minor releases (contain minor breaking changes):\n' );

			for ( const [ packageName, version ] of [ ...minorBreakingChangesPackages ].sort( sortByPackageName ) ) {
				entries.push( formatChangelogEntry( packageName, version.next, version.current ) );
			}

			entries.push( '' );
		}

		if ( newFeaturesPackages.size ) {
			entries.push( 'Releases containing new features:\n' );

			for ( const [ packageName, version ] of [ ...newFeaturesPackages ].sort( sortByPackageName ) ) {
				entries.push( formatChangelogEntry( packageName, version.next, version.current ) );
			}

			entries.push( '' );
		}

		if ( dependencies.size ) {
			entries.push( 'Other releases:\n' );

			for ( const [ packageName, version ] of [ ...dependencies ].sort( sortByPackageName ) ) {
				entries.push( formatChangelogEntry( packageName, version.next, version.current ) );
			}
		}

		entries.push( '</details>' );

		return entries.join( '\n' ).trim();

		function sortByPackageName( a, b ) {
			return a[ 0 ] > b[ 0 ] ? 1 : -1;
		}
	}

	/**
	 * @param {Map.<String, Version>} dependencies
	 * @returns {Map.<String, Version>}
	 */
	function getNewPackages( dependencies ) {
		const packages = new Map();

		for ( const [ packageName, version ] of dependencies ) {
			if ( semver.eq( version.current, '0.0.1' ) ) {
				packages.set( packageName, version );
				dependencies.delete( packageName );
			}
		}

		return packages;
	}

	/**
	 * Returns packages where scope of changes described in the commits' notes match to packages' names.
	 *
	 * @param {Map.<String, Version>} dependencies
	 * @param {String} noteTitle
	 * @returns {Map.<String, Version>}
	 */
	function getPackagesMatchedToScopesFromNotes( dependencies, noteTitle ) {
		const packages = new Map();
		const scopes = new Set();

		for ( const commit of filterCommitsByNoteTitle( publicCommits, noteTitle ) ) {
			for ( const note of commit.notes ) {
				if ( Array.isArray( note.rawScope ) ) {
					scopes.add( note.rawScope[ 0 ] );
				}
			}
		}

		for ( const [ packageName, version ] of dependencies ) {
			const packageWithoutScope = packageName.replace( /^@ckeditor\//, '' );

			for ( const singleScope of scopes ) {
				if ( minimatch( packageWithoutScope, '*' + singleScope ) ) {
					packages.set( packageName, version );
					dependencies.delete( packageName );
				}
			}
		}

		return packages;
	}

	/**
	 * Returns packages that contain new features.
	 *
	 * @param {Map.<String, Version>} dependencies
	 * @returns {Map.<String, Version>}
	 */
	function getPackagesWithNewFeatures( dependencies ) {
		const packages = new Map();

		for ( const [ packageName, version ] of dependencies ) {
			const packagePath = packagesPaths.get( packageName );
			const commits = filterCommitsByPath( publicCommits, packagePath );
			const hasFeatures = commits.some( commit => commit.rawType === 'Feature' );

			if ( hasFeatures ) {
				packages.set( packageName, version );
				dependencies.delete( packageName );
			}
		}

		return packages;
	}

	/**
	 * Returns a formatted entry (string) for the changelog.
	 *
	 * @param {String} packageName
	 * @param {String} nextVersion
	 * @param {String} currentVersion
	 * @returns {String}
	 */
	function formatChangelogEntry( packageName, nextVersion, currentVersion = null ) {
		const npmUrl = `https://www.npmjs.com/package/${ packageName }`;

		if ( currentVersion ) {
			return `* [${ packageName }](${ npmUrl }): v${ currentVersion } => v${ nextVersion }`;
		}

		return `* [${ packageName }](${ npmUrl }): v${ nextVersion }`;
	}

	function logProcess( message ) {
		log.info( '\n📍 ' + chalk.cyan( message ) );
	}

	/**
	 * @param {String} message
	 * @param {Object} [options={}]
	 * @param {Number} [options.indentLevel=0]
	 * @param {Boolean} [options.startWithNewLine=false] Whether to append a new line before the message.
	 */
	function logInfo( message, options = {} ) {
		const indentLevel = options.indentLevel || 0;
		const startWithNewLine = options.startWithNewLine || false;

		log.info( `${ startWithNewLine ? '\n' : '' }${ ' '.repeat( indentLevel * cli.INDENT_SIZE ) }` + message );
	}
};

/**
 * @typedef {Object} Version
 *
 * @param {Boolean} current The current version defined in the `package.json` file.
 *
 * @param {Boolean} next The next version defined during generating the changelog file.
 */
