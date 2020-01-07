/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const semver = require( 'semver' );
const chalk = require( 'chalk' );
const moment = require( 'moment' );
const { tools, logger } = require( '@ckeditor/ckeditor5-dev-utils' );
const changelogUtils = require( '../utils/changelog' );
const cliUtils = require( '../utils/cli' );
const displayCommits = require( '../utils/displaycommits' );
const displayGeneratedChangelogs = require( '../utils/displaygeneratedchangelogs' );
const executeOnPackages = require( '../utils/executeonpackages' );
const generateChangelogFromCommits = require( '../utils/generatechangelogfromcommits' );
const getPackageJson = require( '../utils/getpackagejson' );
const getNewReleaseType = require( '../utils/getnewreleasetype' );
const getSubRepositoriesPaths = require( '../utils/getsubrepositoriespaths' );
const transformCommitFunctionFactory = require( '../utils/transform-commit/transformcommitforsubrepositoryfactory' );
const versionUtils = require( '../utils/versions' );

const bumpTypesPriority = {
	prerelease: 7,
	major: 6,
	premajor: 5,
	minor: 4,
	preminor: 3,
	patch: 2,
	prepatch: 1,
	skip: 0
};

/**
 * Generates a summary changelog for the builds repositories and for the main CKEditor 5 repository.
 *
 * @param {Object} options
 * @param {String} options.cwd Current working directory (packages) from which all paths will be resolved.
 * @param {String} options.packages Where to look for other packages.
 * @param {Array.<String>} [options.skipPackages=[]] Name of packages which won't be touched.
 * @param {Boolean} [options.skipMainRepository=false] Whether to skip the main repository.
 * @param {String} [options.scope=null] Package names have to match to specified glob pattern.
 * @param {String|null} [options.version=null] If specified, this version will be used as proposed
 * during generating a changelog for a package.
 */
module.exports = function generateSummaryChangelog( options ) {
	const log = logger();
	const cwd = process.cwd();

	const indent = ' '.repeat( cliUtils.INDENT_SIZE );
	const pathsCollection = getSubRepositoriesPaths( {
		cwd: options.cwd,
		packages: options.packages,
		scope: options.scope || null,
		skipPackages: options.skipPackages || [],
		skipMainRepository: true
	} );

	// The main repository must be at the end because its changelog is a summary of all changes that have been done.
	if ( !options.skipMainRepository ) {
		pathsCollection.skipped.delete( options.cwd );
		pathsCollection.matched.add( options.cwd );
	}

	const generatedChangelogMap = new Map();

	logProcess( 'Generating summary changelogs...' );

	return executeOnPackages( pathsCollection.matched, generateSummaryChangelogForSingleRepository )
		.then( () => {
			logProcess( 'Summary' );

			// An empty line increases the readability.
			console.log( '' );
			displayGeneratedChangelogs( generatedChangelogMap );
		} );

	// Generates the summary changelog for specified repository.
	//
	// @param {String} repositoryPath
	// @returns {Promise}
	function generateSummaryChangelogForSingleRepository( repositoryPath ) {
		process.chdir( repositoryPath );

		const packageJson = getPackageJson( repositoryPath );

		log.info( '\n' + indent + chalk.bold( `Generating changelog for "${ chalk.underline( packageJson.name ) }"...` ) );

		const dependencies = getMapWithDependenciesVersions(
			getAllDependenciesForRepository( repositoryPath )
		);

		let tagName = versionUtils.getLastFromChangelog( repositoryPath );
		let suggestedBumpFromCommits;

		if ( tagName ) {
			tagName = 'v' + tagName;
		}

		const transformCommitFunction = transformCommitFunctionFactory( {
			returnInvalidCommit: true
		} );

		return getNewReleaseType( transformCommitFunction, { tagName } )
			.then( result => {
				suggestedBumpFromCommits = result.releaseType === 'internal' ? 'skip' : result.releaseType;

				displayCommits( result.commits, { indentLevel: 2 } );

				const suggestedBumpFromDependencies = getSuggestedBumpVersionType( dependencies );
				const commitsWeight = bumpTypesPriority[ suggestedBumpFromCommits ];
				const packagesWeight = bumpTypesPriority[ suggestedBumpFromDependencies ];

				let newReleaseType;

				if ( options.version ) {
					newReleaseType = options.version;
				} else if ( !packagesWeight || commitsWeight > packagesWeight ) {
					newReleaseType = suggestedBumpFromCommits;
				} else {
					newReleaseType = suggestedBumpFromDependencies;
				}

				return cliUtils.provideVersion( packageJson.version, newReleaseType, { disableInternalVersion: true } );
			} )
			.then( version => {
				if ( version === 'skip' ) {
					return Promise.resolve();
				}

				let promise = Promise.resolve();

				// Generate the changelog entries based on dependencies.
				let changelogEntries = getChangelogFromDependencies( {
					dependencies,
					newVersion: version,
					currentVersion: packageJson.version,
					repositoryUrl: packageJson.repository.url.replace( /\.git$/, '' ),
				} );

				// Additional notes for changelog generated from commits should be added if any dependency has been added or changed.
				const additionalNotes = changelogEntries.trim().split( '\n' ).length !== 1;

				if ( suggestedBumpFromCommits !== 'skip' ) {
					promise = generateChangelogFromCommits( {
						version,
						additionalNotes,
						currentTag: 'v' + version,
						previousTag: tagName,
						transformCommit: transformCommitFunctionFactory(),
						isInternalRelease: false,
						doNotSave: true
					} );
				}

				return promise.then( changesBasedOnCommits => {
					// Part of the changelog generated from commits should be attached to changelog entries.
					if ( changesBasedOnCommits ) {
						changelogEntries = changesBasedOnCommits.trim() + '\n\n' +
							changelogEntries.split( '\n' )
								.slice( 1 ) // First line contains a header which is already generated.
								.join( '\n' )
								.trim();
					}

					if ( !fs.existsSync( changelogUtils.changelogFile ) ) {
						log.warning( indent + 'Changelog file does not exist. Creating...' );

						changelogUtils.saveChangelog( changelogUtils.changelogHeader );
					}

					let currentChangelog = changelogUtils.getChangelog( repositoryPath );

					// Remove header from current changelog.
					currentChangelog = currentChangelog.replace( changelogUtils.changelogHeader, '' );

					// Concat header, new and current changelog.
					let newChangelog = changelogUtils.changelogHeader + changelogEntries + '\n\n\n' + currentChangelog.trim();
					newChangelog = newChangelog.trim() + '\n';

					// Save the changelog.
					changelogUtils.saveChangelog( newChangelog, repositoryPath );

					log.info(
						indent +
						chalk.green( `Changelog for "${ chalk.underline( packageJson.name ) }" (v${ version }) has been generated.` )
					);

					// Commit the new changelog.
					tools.shExec( `git add ${ changelogUtils.changelogFile }`, { verbosity: 'error' } );
					tools.shExec( 'git commit -m "Docs: Changelog. [skip ci]"', { verbosity: 'error' } );

					generatedChangelogMap.set( packageJson.name, version );
				} );
			} )
			.then( () => {
				process.chdir( cwd );
			} )
			.catch( err => {
				log.error( err.stack );
			} );
	}

	// Returns a list which contains all dependencies. It means – not only these specified in `package.json`
	// but also dependency of the dependencies.
	//
	// @param {String} repositoryPath Path to the parsed repository.
	// @returns {Set} List of all dependencies.
	function getAllDependenciesForRepository( repositoryPath ) {
		const packageJson = getPackageJson( repositoryPath );
		const packagesToCheck = Object.keys( packageJson.dependencies || packageJson.devDependencies )
			.filter( isValidDependency );

		const allDependencies = new Set();
		const checkedPackages = new Set();

		while ( packagesToCheck.length ) {
			const packageName = packagesToCheck.shift();

			// Does not check the same package more than once.
			if ( checkedPackages.has( packageName ) ) {
				continue;
			}

			checkedPackages.add( packageName );

			const currentPackagePath = getPathToRepository( packageName );

			// Package cannot be dependency for itself.
			if ( currentPackagePath === repositoryPath ) {
				continue;
			}

			// If package is not installed locally, we aren't able to get the changelog entries.
			if ( !pathsCollection.skipped.has( currentPackagePath ) && !pathsCollection.matched.has( currentPackagePath ) ) {
				continue;
			}

			const currentDependencyPackageJson = getPackageJson( currentPackagePath );

			packagesToCheck.push(
				...Object.keys( currentDependencyPackageJson.dependencies || {} )
					.filter( isValidDependency )
			);

			allDependencies.add( packageName );
		}

		return allDependencies;
	}

	// Checks whether specified package name matches to `@ckeditor/ckeditor5-*` schema.
	// Dev package (`@ckeditor/ckeditor5-dev-*`) is not valid.
	//
	// @param {String} packageName
	// @returns {Boolean}
	function isValidDependency( packageName ) {
		if ( !packageName.match( /^@ckeditor/ ) ) {
			return false;
		}

		if ( packageName.match( /-dev-/ ) ) {
			return false;
		}

		return true;
	}

	// Returns a path to the repository for specified package.
	//
	// @param {String} packageName
	// @returns {String}
	function getPathToRepository( packageName ) {
		return packageName.replace( '@ckeditor', path.join( options.cwd, options.packages ) );
	}

	// Builds a map which contains current and future versions of specified packages.
	//
	// @params {Set} dependencies
	// @returns {Map}
	function getMapWithDependenciesVersions( dependencies ) {
		const dependenciesVersions = new Map();

		for ( const packageName of [ ...dependencies ].sort() ) {
			const repositoryPath = getPathToRepository( packageName );
			const nextVersion = versionUtils.getLastFromChangelog( repositoryPath );
			const currentVersion = versionUtils.getCurrent( repositoryPath );

			// If "nextVersion" is null, the changelog for the package hasn't been generated.
			if ( !nextVersion ) {
				continue;
			}

			// Changelog contains a version for the future release.
			// Version specified in `package.json` is bumping during the release process,
			// we can assume that the versions are different.
			if ( nextVersion !== currentVersion ) {
				dependenciesVersions.set( packageName, { currentVersion, nextVersion, repositoryPath } );
			}
		}

		return dependenciesVersions;
	}

	// Returns a new type of the release for current package.
	//
	// @params {String} version
	// @params {Map} dependencies
	// @returns {String}
	function getSuggestedBumpVersionType( dependencies ) {
		let currentBumpType = null;

		for ( const [ , { currentVersion, nextVersion } ] of dependencies ) {
			if ( !nextVersion ) {
				continue;
			}

			const diffType = semver.diff( currentVersion, nextVersion );

			if ( shouldOverwriteReleaseType( currentBumpType, diffType ) ) {
				currentBumpType = diffType;
			}

			// When the suggested bump is equal to "major", we can stop analyzing next versions.
			if ( currentBumpType === 'major' ) {
				break;
			}
		}

		return currentBumpType;
	}

	// Checks whether specified `currentBumpType` bump for release can be overwrite.
	//
	// It returns true when:
	// - "currentBumpType" is null (it's not set yet) or
	// - returned diff has higher priority than the current suggested bump.
	//
	// @params {String} currentBumpType
	// @params {String} diffType
	// @returns {Boolean}
	function shouldOverwriteReleaseType( currentBumpType, diffType ) {
		if ( !bumpTypesPriority[ diffType ] ) {
			return false;
		}

		if ( !currentBumpType ) {
			return true;
		}

		return bumpTypesPriority[ diffType ] > bumpTypesPriority[ currentBumpType ];
	}

	// Generates new changelog entry.
	//
	// @params {Object} options
	// @params {String} options.repositoryURL
	// @params {String} options.newVersion
	// @params {String} options.currentVersion
	// @params {Map} options.dependencies
	// @returns {String}
	function getChangelogFromDependencies( options ) {
		const date = moment().format( 'YYYY-MM-DD' );

		const entries = [
			// eslint-disable-next-line max-len
			`## [${ options.newVersion }](${ options.repositoryUrl }/compare/v${ options.currentVersion }...v${ options.newVersion }) (${ date })`,
			'',
		];

		const allowBreakingChangeInMinor = areBreakingChangesAcceptableInVersion( options.newVersion );
		const newPackages = getNewPackages( options.dependencies );

		// We need to remove new packages from the whole collection because we don't want to have duplicated (as minor or major) releases.
		removeDependencies( newPackages, options.dependencies );

		const majorReleasePackages = getMajorReleasePackages( options.dependencies );
		const majorBreakingChangesReleasePackages = getMajorBreakingChangesReleasePackages( majorReleasePackages );
		let majorReleaseWithMinorChanges = new Set();

		// For major releases, we would like to display in a separately category packages that have "MINOR BREAKING CHANGES".
		if ( majorReleasePackages.size ) {
			majorReleaseWithMinorChanges = getMinorBreakingChangesReleasePackages( options.dependencies );
		}

		const minorReleasePackages = getMinorReleasePackages( options.dependencies );
		const minorBreakingChangesReleasePackages = getMinorBreakingChangesReleasePackages( minorReleasePackages );

		const patchReleasePackages = getPatchReleasePackages( options.dependencies );

		// `major|minorBreakingChangesReleasePackages` are duplicated in `major|minorReleasePackages` collections.
		// Because we don't want to duplicate them, let's clean it before starting generating changelog entries.
		removeDependencies( majorReleaseWithMinorChanges, majorReleasePackages );
		removeDependencies( majorBreakingChangesReleasePackages, majorReleasePackages );
		removeDependencies( minorBreakingChangesReleasePackages, minorReleasePackages );

		const hasChangesInAnyOfPackages = [
			newPackages.size,
			majorReleasePackages.size,
			majorBreakingChangesReleasePackages.size,
			minorReleasePackages.size,
			minorBreakingChangesReleasePackages.size,
			patchReleasePackages.size
		].some( number => number > 0 );

		// Push the "Dependencies" header to entries list if any package has been added or changed.
		if ( hasChangesInAnyOfPackages ) {
			entries.push( '### Dependencies' );
			entries.push( '' );
		}

		if ( newPackages.size ) {
			entries.push( 'New packages:\n' );

			for ( const [ packageName, { nextVersion } ] of newPackages ) {
				entries.push( formatChangelogEntry( packageName, nextVersion ) );
			}

			entries.push( '' );
		}

		if ( majorBreakingChangesReleasePackages.size ) {
			entries.push( 'Major releases (contain major breaking changes):\n' );

			for ( const [ packageName, { currentVersion, nextVersion } ] of majorBreakingChangesReleasePackages ) {
				entries.push( formatChangelogEntry( packageName, nextVersion, currentVersion ) );
			}

			entries.push( '' );
		}

		if ( majorReleaseWithMinorChanges.size ) {
			entries.push( 'Major releases (contain minor breaking changes):\n' );

			for ( const [ packageName, { currentVersion, nextVersion } ] of majorReleaseWithMinorChanges ) {
				entries.push( formatChangelogEntry( packageName, nextVersion, currentVersion ) );
			}

			entries.push( '' );
		}

		if ( majorReleasePackages.size ) {
			entries.push( 'Major releases (dependencies of those packages have breaking changes):\n' );

			for ( const [ packageName, { currentVersion, nextVersion } ] of majorReleasePackages ) {
				entries.push( formatChangelogEntry( packageName, nextVersion, currentVersion ) );
			}

			entries.push( '' );
		}

		if ( minorBreakingChangesReleasePackages.size ) {
			if ( allowBreakingChangeInMinor ) {
				entries.push( 'Minor releases (containing major/minor breaking changes):\n' );
			} else {
				entries.push( 'Minor releases (containing minor breaking changes):\n' );
			}

			for ( const [ packageName, { currentVersion, nextVersion } ] of minorBreakingChangesReleasePackages ) {
				entries.push( formatChangelogEntry( packageName, nextVersion, currentVersion ) );
			}

			entries.push( '' );
		}

		if ( minorReleasePackages.size ) {
			entries.push( 'Minor releases (new features, no breaking changes):\n' );

			for ( const [ packageName, { currentVersion, nextVersion } ] of minorReleasePackages ) {
				entries.push( formatChangelogEntry( packageName, nextVersion, currentVersion ) );
			}

			entries.push( '' );
		}

		if ( patchReleasePackages.size ) {
			entries.push( 'Patch releases (bug fixes, internal changes):\n' );

			for ( const [ packageName, { currentVersion, nextVersion } ] of patchReleasePackages ) {
				entries.push( formatChangelogEntry( packageName, nextVersion, currentVersion ) );
			}

			entries.push( '' );
		}

		return entries.join( '\n' ).trim();
	}

	// Filters out packages which were not introduced in the current milestone.
	//
	// @params {Map} dependencies
	// @returns {Map}
	function getNewPackages( dependencies ) {
		return filterPackages( dependencies, ( packageName, { currentVersion } ) => {
			return semver.eq( currentVersion, '0.0.1' );
		} );
	}

	// Returns a collection of packages which the future release is marked as "major" and contain "MAJOR BREAKING CHANGES"
	// entries in their changelogs.
	//
	// @params {Map} dependencies
	// @returns {Map}
	function getMajorBreakingChangesReleasePackages( dependencies ) {
		return filterPackages( dependencies, ( packageName, { nextVersion, repositoryPath } ) => {
			return changelogUtils.hasMajorBreakingChanges( nextVersion, repositoryPath );
		} );
	}

	// Returns a collection of packages which the future release is marked as "major".
	//
	// @params {Map} dependencies
	// @returns {Map}
	function getMajorReleasePackages( dependencies ) {
		return filterPackages( dependencies, ( packageName, { currentVersion, nextVersion } ) => {
			const versionDiff = semver.diff( currentVersion, nextVersion );

			return versionDiff === 'major' || versionDiff === 'premajor' || versionDiff === 'prerelease';
		} );
	}

	// Returns a collection of packages which the future release is marked as "minor" and contain "MINOR BREAKING CHANGES"
	// entries in their changelogs.
	//
	// @params {Map} dependencies
	// @returns {Map}
	function getMinorBreakingChangesReleasePackages( dependencies ) {
		return filterPackages( dependencies, ( packageName, { nextVersion, repositoryPath } ) => {
			return changelogUtils.hasMinorBreakingChanges( nextVersion, repositoryPath );
		} );
	}

	// Returns a collection of packages which the future release is marked as "minor".
	//
	// @params {Map} dependencies
	// @returns {Map}
	function getMinorReleasePackages( dependencies ) {
		return filterPackages( dependencies, ( packageName, { currentVersion, nextVersion } ) => {
			const versionDiff = semver.diff( currentVersion, nextVersion );

			return versionDiff === 'minor' || versionDiff === 'preminor';
		} );
	}

	// Returns a collection of packages which the future release is marked as "patch".
	//
	// @params {Map} dependencies
	// @returns {Map}
	function getPatchReleasePackages( dependencies ) {
		return filterPackages( dependencies, ( packageName, { currentVersion, nextVersion } ) => {
			const versionDiff = semver.diff( currentVersion, nextVersion );

			return versionDiff === 'patch' || versionDiff === 'prepatch';
		} );
	}

	// Executes specified callback for each item on passed dependencies collection.
	//
	// @params {Map} dependencies
	// @params {Function} callback A function which accepts three parameters: `String` packageName, `String` currentVersion
	// and `String` nextVersion. The function must return `Boolean` value.
	// @returns {Map}
	function filterPackages( dependencies, callback ) {
		const packages = new Map();

		for ( const [ packageName, options ] of dependencies ) {
			if ( callback( packageName, options ) ) {
				packages.set( packageName, Object.assign( {}, options ) );
			}
		}

		return packages;
	}

	// Removes packages from the collection (`removeFrom`) based on items in the `dependenciesToRemove` collection.
	//
	// @params {Map} dependenciesToRemove
	// @params {Map} removeFrom
	function removeDependencies( dependenciesToRemove, removeFrom ) {
		for ( const [ packageName ] of dependenciesToRemove ) {
			removeFrom.delete( packageName );
		}
	}

	// Returns a formatted string for changelog.
	//
	// @params {String} packageName
	// @params {String} nextVersion
	// @params {String|null} [currentVersion=null]
	// @returns {String}
	function formatChangelogEntry( packageName, nextVersion, currentVersion = null ) {
		const packageJson = getPackageJson( getPathToRepository( packageName ) );
		const repositoryUrl = packageJson.repository.url.replace( /\.git$/, '' );
		const githubUrl = `${ repositoryUrl }/releases/tag/v${ nextVersion }`;
		const npmUrl = `https://www.npmjs.com/package/${ packageName }`;

		if ( currentVersion ) {
			return `* [${ packageName }](${ npmUrl }): v${ currentVersion } => [v${ nextVersion }](${ githubUrl })`;
		}

		return `* [${ packageName }](${ npmUrl }): [v${ nextVersion }](${ githubUrl })`;
	}

	// Checks whether breaking changes are acceptable for specified version.
	//
	// @params {String} version
	// @returns {Boolean}
	function areBreakingChangesAcceptableInVersion( version ) {
		// For any version above the `1.0.0`, breaking changes mean that "major" version will be bumped.
		if ( !semver.gt( '1.0.0', version ) ) {
			return false;
		}

		// "prerelease" below `1.0.0` should be parsed as "major" release.
		return semver.diff( version, '1.0.0' ) !== 'prerelease';
	}

	function logProcess( message ) {
		log.info( '\n📍 ' + chalk.cyan( message ) );
	}
};
