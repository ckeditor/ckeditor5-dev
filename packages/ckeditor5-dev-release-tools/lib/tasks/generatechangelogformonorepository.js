/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const { tools, logger } = require( '@ckeditor/ckeditor5-dev-utils' );
const compareFunc = require( 'compare-func' );
const chalk = require( 'chalk' );
const semver = require( 'semver' );
const changelogUtils = require( '../utils/changelog' );
const cli = require( '../utils/cli' );
const displayCommits = require( '../utils/displaycommits' );
const displaySkippedPackages = require( '../utils/displayskippedpackages' );
const generateChangelog = require( '../utils/generatechangelog' );
const getPackageJson = require( '../utils/getpackagejson' );
const getPackagesPaths = require( '../utils/getpackagespaths' );
const getCommits = require( '../utils/getcommits' );
const getNewVersionType = require( '../utils/getnewversiontype' );
const getWriterOptions = require( '../utils/getwriteroptions' );
const { getRepositoryUrl } = require( '../utils/transformcommitutils' );
const transformCommitFactory = require( '../utils/transformcommitfactory' );

const VERSIONING_POLICY_URL = 'https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html';
const noteInfo = `[ℹ️](${ VERSIONING_POLICY_URL }#major-and-minor-breaking-changes)`;

/**
 * Generates the single changelog for the mono repository. It means that changes which have been done in all packages
 * will be described in the changelog file located in the `options.cwd` directory.
 *
 * The typed version will be the same for all packages. See: https://github.com/ckeditor/ckeditor5/issues/7323.
 *
 * @param {Object} options
 *
 * @param {String} options.cwd Current working directory (packages) from which all paths will be resolved.
 *
 * @param {String} options.packages Where to look for packages.
 *
 * @param {Function} options.transformScope A function that returns a URL to a package from a scope of a commit.
 *
 * @param {String} [options.scope] Package names have to match to specified glob pattern in order to be processed.
 *
 * @param {Array.<String>} [options.skipPackages=[]] Name of packages which won't be touched.
 *
 * @param {Boolean} [options.skipLinks=false] If set on true, links to release or commits will be omitted.
 *
 * @param {String} [options.from] A commit or tag name that will be the first param of the range of commits to collect.
 *
 * @param {Boolean} [options.highlightsPlaceholder=false] Whether to add a note about release highlights.
 *
 * @param {Boolean} [options.collaborationFeatures=false] Whether to add a note about collaboration features.
 *
 * @param {String} [options.releaseBranch='master'] A name of the branch that should be used for releasing packages.
 *
 * @param {Array.<ExternalRepository>} [options.externalRepositories=[]] An array of object with additional repositories
 * that the function takes into consideration while gathering commits. It assumes that those directories are also mono repositories.
 *
 * @returns {Promise}
 */
module.exports = async function generateChangelogForMonoRepository( options ) {
	const log = logger();
	const cwd = process.cwd();
	const pkgJson = getPackageJson( options.cwd );

	logProcess( 'Collecting paths to packages...' );

	const pathsCollection = gatherAllPackagesPaths( {
		cwd: options.cwd,
		packages: options.packages,
		scope: options.scope || null,
		skipPackages: options.skipPackages || [],
		externalRepositories: options.externalRepositories || []
	} );

	logProcess( 'Collecting all commits since the last release...' );

	// Collection of all entries (real commits + additional "fake" commits extracted from descriptions).
	let allCommits;

	// Collection of public entries that will be inserted in the changelog.
	let publicCommits;

	// The next version for the upcoming release.
	let nextVersion = null;

	// A map contains packages and their new versions.
	const packagesVersion = new Map();

	// A map contains packages and their current versions.
	const currentPackagesVersion = new Map();

	// A map contains packages and their paths (where they are located)
	const packagesPaths = new Map();

	const commitOptions = {
		cwd: options.cwd,
		from: options.from ? options.from : 'v' + pkgJson.version,
		releaseBranch: options.releaseBranch || 'master',
		externalRepositories: options.externalRepositories || []
	};

	return gatherAllCommits( commitOptions )
		.then( commits => {
			allCommits = commits;

			logInfo( `Found ${ commits.length } entries to parse.`, { indentLevel: 1, startWithNewLine: true } );
		} )
		.then( () => typeNewVersionForAllPackages() )
		.then( () => generateChangelogFromCommits() )
		.then( changesFromCommits => saveChangelog( changesFromCommits ) )
		.then( () => {
			logProcess( 'Summary' );

			displaySkippedPackages( new Set( [
				...pathsCollection.skipped
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
	 * Returns collections with packages found in the `options.cwd` directory and the external repositories.
	 *
	 * @param {Object} options
	 * @param {String} options.cwd Current working directory (packages) from which all paths will be resolved.
	 * @param {String} options.packages Where to look for packages.
	 * @param {String} options.scope Package names have to match to specified glob pattern in order to be processed.
	 * @param {Array.<String>} options.skipPackages Name of packages which won't be touched.
	 * @param {Array.<ExternalRepository>} options.externalRepositories An array of object with additional repositories
	 * that the function takes into consideration while gathering packages.
	 * @returns {PathsCollection}
	 */
	function gatherAllPackagesPaths( options ) {
		logInfo( `Processing "${ options.cwd }"...`, { indentLevel: 1 } );

		const pathsCollection = getPackagesPaths( {
			cwd: options.cwd,
			packages: options.packages,
			scope: options.scope,
			skipPackages: options.skipPackages,
			skipMainRepository: true
		} );

		for ( const externalRepository of options.externalRepositories ) {
			logInfo( `Processing "${ externalRepository.cwd }"...`, { indentLevel: 1 } );

			const externalPackages = getPackagesPaths( {
				cwd: externalRepository.cwd,
				packages: externalRepository.packages,
				scope: externalRepository.scope || null,
				skipPackages: externalRepository.skipPackages || [],
				skipMainRepository: true
			} );

			// The main package in an external repository is a private package.
			externalPackages.skipped.delete( externalRepository.cwd );

			// Merge results with the object that will be returned.
			[ ...externalPackages.matched ].forEach( item => pathsCollection.matched.add( item ) );
			[ ...externalPackages.skipped ].forEach( item => pathsCollection.skipped.add( item ) );
		}

		// The main repository should be at the end of the list.
		pathsCollection.skipped.delete( options.cwd );
		pathsCollection.matched.add( options.cwd );

		return pathsCollection;
	}

	/**
	 * Returns a promise that resolves an array of commits since the last tag specified as `options.from`.
	 *
	 * @param {Object} options
	 * @param {String} options.cwd Current working directory (packages) from which all paths will be resolved.
	 * @param {String} options.from A commit or tag name that will be the first param of the range of commits to collect.
	 * @param {String} options.releaseBranch A name of the branch that should be used for releasing packages.
	 * @param {Array.<ExternalRepository>} options.externalRepositories An array of object with additional repositories
	 * that the function takes into consideration while gathering commits.
	 * @returns {Promise.<Array.<Commit>>}
	 */
	function gatherAllCommits( options ) {
		logInfo( `Processing "${ options.cwd }"...`, { indentLevel: 1 } );

		const transformCommit = transformCommitFactory( {
			useExplicitBreakingChangeGroups: true
		} );

		const commitOptions = {
			from: options.from,
			releaseBranch: options.releaseBranch
		};

		let promise = getCommits( transformCommit, commitOptions )
			.then( commits => {
				logInfo( `Found ${ commits.length } entries in "${ options.cwd }".`, { indentLevel: 1 } );

				return commits;
			} );

		for ( const externalRepository of options.externalRepositories ) {
			promise = promise.then( commits => {
				logInfo( `Processing "${ externalRepository.cwd }"...`, { indentLevel: 1, startWithNewLine: true } );
				process.chdir( externalRepository.cwd );

				const commitOptions = {
					from: externalRepository.from || options.from,
					releaseBranch: externalRepository.releaseBranch || options.releaseBranch
				};

				return getCommits( transformCommit, commitOptions )
					.then( newCommits => {
						logInfo( `Found ${ newCommits.length } entries in "${ externalRepository.cwd }".`, { indentLevel: 1 } );

						for ( const singleCommit of newCommits ) {
							singleCommit.skipCommitsLink = externalRepository.skipLinks || false;
						}

						// Merge arrays with the commits.
						return [].concat( commits, newCommits );
					} );
			} );
		}

		return promise.then( commits => {
			process.chdir( options.cwd );

			return commits;
		} );
	}

	/**
	 * Asks the user about the new version for all packages for the upcoming release.
	 *
	 * @returns {Promise}
	 */
	function typeNewVersionForAllPackages() {
		logProcess( 'Determining the new version...' );

		displayAllChanges();

		// Find the highest version in all packages.
		const [ packageHighestVersion, highestVersion ] = [ ...pathsCollection.matched ]
			.reduce( ( currentHighest, repositoryPath ) => {
				const packageJson = getPackageJson( repositoryPath );

				currentPackagesVersion.set( packageJson.name, packageJson.version );

				if ( semver.gt( packageJson.version, currentHighest[ 1 ] ) ) {
					return [ packageJson.name, packageJson.version ];
				}

				return currentHighest;
			}, [ null, '0.0.0' ] );

		let bumpType = getNewVersionType( allCommits );

		// When made commits are not public, bump the `patch` version.
		if ( bumpType === 'internal' ) {
			bumpType = 'patch';
		}

		return cli.provideNewVersionForMonoRepository( highestVersion, packageHighestVersion, bumpType, { indentLevel: 1 } )
			.then( version => {
				nextVersion = version;

				let promise = Promise.resolve();

				// Update the version for all packages.
				for ( const packagePath of pathsCollection.matched ) {
					promise = promise.then( () => {
						const pkgJson = getPackageJson( packagePath );

						packagesPaths.set( pkgJson.name, packagePath );
						packagesVersion.set( pkgJson.name, nextVersion );
					} );
				}

				return promise;
			} );
	}

	/**
	 * Displays breaking changes and commits.
	 */
	function displayAllChanges() {
		const majorBreakingChangesCommits = filterCommitsByNoteTitle( allCommits, 'MAJOR BREAKING CHANGES' );
		const infoOptions = { indentLevel: 1, startWithNewLine: true };

		if ( majorBreakingChangesCommits.length > 0 ) {
			logInfo( `🔸 Found ${ chalk.bold( 'MAJOR BREAKING CHANGES' ) }:`, infoOptions );
			displayCommits( majorBreakingChangesCommits, { attachLinkToCommit: true, indentLevel: 2 } );
		} else {
			logInfo( `🔸 ${ chalk.bold( 'MAJOR BREAKING CHANGES' ) } commits have not been found.`, infoOptions );
		}

		const minorBreakingChangesCommits = filterCommitsByNoteTitle( allCommits, 'MINOR BREAKING CHANGES' );

		if ( minorBreakingChangesCommits.length > 0 ) {
			logInfo( `🔸 Found ${ chalk.bold( 'MINOR BREAKING CHANGES' ) }:`, infoOptions );
			displayCommits( minorBreakingChangesCommits, { attachLinkToCommit: true, indentLevel: 2 } );
		} else {
			logInfo( `🔸 ${ chalk.bold( 'MINOR BREAKING CHANGES' ) } commits have not been found.`, infoOptions );
		}

		logInfo( '🔸 Commits since the last release:', infoOptions );

		const commits = allCommits.sort( sortFunctionFactory( 'scope' ) );

		displayCommits( commits, { indentLevel: 2 } );

		logInfo( '💡 Review commits listed above and propose the new version for all packages in the upcoming release.', infoOptions );
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
	 * Generates a list of changes based on the commits in the main repository.
	 *
	 * @returns {Promise.<String>}
	 */
	function generateChangelogFromCommits() {
		logProcess( 'Generating the changelog...' );

		const version = packagesVersion.get( pkgJson.name );

		const writerContext = {
			version,
			commit: 'commit',
			repoUrl: getRepositoryUrl( options.cwd ),
			currentTag: 'v' + version,
			previousTag: 'v' + pkgJson.version,
			isPatch: semver.diff( version, pkgJson.version ) === 'patch',
			highlightsPlaceholder: options.highlightsPlaceholder || false,
			collaborationFeatures: options.collaborationFeatures || false,
			skipCommitsLink: Boolean( options.skipLinks ),
			skipCompareLink: Boolean( options.skipLinks )
		};

		const writerOptions = getWriterOptions( {
			// We do not allow modifying the commit hash value by the generator itself.
			hash: hash => hash
		} );

		writerOptions.commitsSort = sortFunctionFactory( 'rawScope' );
		writerOptions.notesSort = sortFunctionFactory( 'rawScope' );

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

		return generateChangelog( publicCommits, writerContext, writerOptions )
			.then( changes => {
				logInfo( 'Changes based on commits have been generated.', { indentLevel: 1 } );

				return Promise.resolve( changes );
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

		if ( !fs.existsSync( changelogUtils.changelogFile ) ) {
			logInfo( 'Changelog file does not exist. Creating...', { isWarning: true, indentLevel: 1 } );

			changelogUtils.saveChangelog( changelogUtils.changelogHeader );
		}

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
			'<details>',
			'<summary>Released packages (summary)</summary>'
		];

		if ( newPackages.size ) {
			entries.push( '\nNew packages:\n' );

			for ( const [ packageName, version ] of [ ...newPackages ].sort( sortByPackageName ) ) {
				entries.push( formatChangelogEntry( packageName, version.next ) );
			}
		}

		if ( majorBreakingChangesPackages.size ) {
			entries.push( '\nMajor releases (contain major breaking changes):\n' );

			for ( const [ packageName, version ] of [ ...majorBreakingChangesPackages ].sort( sortByPackageName ) ) {
				entries.push( formatChangelogEntry( packageName, version.next, version.current ) );
			}
		}

		if ( minorBreakingChangesPackages.size ) {
			entries.push( '\nMinor releases (contain minor breaking changes):\n' );

			for ( const [ packageName, version ] of [ ...minorBreakingChangesPackages ].sort( sortByPackageName ) ) {
				entries.push( formatChangelogEntry( packageName, version.next, version.current ) );
			}
		}

		if ( newFeaturesPackages.size ) {
			entries.push( '\nReleases containing new features:\n' );

			for ( const [ packageName, version ] of [ ...newFeaturesPackages ].sort( sortByPackageName ) ) {
				entries.push( formatChangelogEntry( packageName, version.next, version.current ) );
			}
		}

		if ( dependencies.size ) {
			entries.push( '\nOther releases:\n' );

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
			const packageScope = packageName.replace( /^@ckeditor\/ckeditor5?-/, '' );

			for ( const singleScope of scopes ) {
				if ( packageScope === singleScope ) {
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

	/**
	 * Returns a function that is being used when sorting commits.
	 *
	 * @param {String} scopeField A name of the field that saves the commit's scope.
	 * @returns {Function}
	 */
	function sortFunctionFactory( scopeField ) {
		return compareFunc( item => {
			if ( Array.isArray( item[ scopeField ] ) ) {
				// A hack that allows moving all scoped commits from the main repository/package at the beginning of the list.
				if ( item[ scopeField ][ 0 ] === pkgJson.name ) {
					return 'a'.repeat( 15 );
				}

				return item[ scopeField ][ 0 ];
			}

			// A hack that allows moving all non-scoped commits or breaking changes notes at the end of the list.
			return 'z'.repeat( 15 );
		} );
	}

	function logProcess( message ) {
		log.info( '\n📍 ' + chalk.cyan( message ) );
	}

	/**
	 * @param {String} message
	 * @param {Object} [options={}]
	 * @param {Number} [options.indentLevel=0]
	 * @param {Boolean} [options.startWithNewLine=false] Whether to append a new line before the message.
	 * @param {Boolean} [options.isWarning=false] Whether to use `warning` method instead of `log`.
	 */
	function logInfo( message, options = {} ) {
		const indentLevel = options.indentLevel || 0;
		const startWithNewLine = options.startWithNewLine || false;
		const method = options.isWarning ? 'warning' : 'info';

		log[ method ]( `${ startWithNewLine ? '\n' : '' }${ ' '.repeat( indentLevel * cli.INDENT_SIZE ) }` + message );
	}
};

/**
 * @typedef {Object} Version
 *
 * @param {Boolean} current The current version defined in the `package.json` file.
 *
 * @param {Boolean} next The next version defined during generating the changelog file.
 */

/**
 * @typedef {Object} ExternalRepository
 *
 * @param {String} cwd An absolute path to the repository.
 *
 * @param {String} packages Subdirectory in a given `cwd` that should searched for packages. E.g. `'packages'`.
 *
 * @param {String} [scope] Glob pattern for package names to be processed.
 *
 * @param {Array.<String>} [skipPackages] Name of packages which won't be touched.
 *
 * @param {Boolean} [skipLinks] If set on `true`, a URL to commit (hash) will be omitted.
 *
 * @param {String} [from] A commit or tag name that will be the first param of the range of commits to collect. If not specified,
 * the option will inherit its value from the function's `options` object.
 *
 * @param {String} [releaseBranch] A name of the branch that should be used for releasing packages. If not specified, the branch
 * used for the main repository will be used.
 */
