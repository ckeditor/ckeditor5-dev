/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
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
const displayGeneratedChangelogs = require( '../utils/displaygeneratedchangelogs' );
const executeOnPackages = require( '../utils/executeonpackages' );
const generateChangelogFromCommits = require( '../utils/generatechangelogfromcommits' );
const getPackageJson = require( '../utils/getpackagejson' );
const getNewReleaseType = require( '../utils/getnewreleasetype' );
const getSubRepositoriesPaths = require( '../utils/getsubrepositoriespaths' );
const transformCommitFunction = require( '../utils/transform-commit/transformcommitforsubrepository' );
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
 * @param {RegExp} [options.scope] Package names have to match to specified pattern.
 */
module.exports = function generateSummaryChangelog( options ) {
	const log = logger();
	const cwd = process.cwd();

	const pathsCollection = getSubRepositoriesPaths( {
		cwd: options.cwd,
		packages: options.packages,
		scope: options.scope,
		skipPackages: options.skipPackages || []
	} );

	if ( !options.skipMainRepository ) {
		pathsCollection.packages.add( options.cwd );
	}

	const generatedChangelogMap = new Map();

	return executeOnPackages( pathsCollection.packages, generateSummaryChangelogForSingleRepository )
		.then( () => {
			displayGeneratedChangelogs( generatedChangelogMap );

			log.info( 'Done.' );
		} );

	// Generates the summary changelog for specified repository.
	//
	// @param {String} repositoryPath
	// @returns {Promise}
	function generateSummaryChangelogForSingleRepository( repositoryPath ) {
		process.chdir( repositoryPath );

		const packageJson = getPackageJson( repositoryPath );

		log.info( '' );
		log.info( chalk.bold.blue( `Generating changelog for "${ packageJson.name }"...` ) );

		const dependencies = getMapWithDependenciesVersions(
			getAllDependenciesForRepository( repositoryPath )
		);

		let suggestedBumpFromCommits;
		const suggestedBumpFromDependencies = getSuggestedBumpVersionType( dependencies );

		let tagName = versionUtils.getLastFromChangelog( repositoryPath );

		if ( tagName ) {
			tagName = 'v' + tagName;
		}

		return getNewReleaseType( transformCommitFunction, { tagName } )
			.then( result => {
				suggestedBumpFromCommits = result.releaseType === 'internal' ? 'skip' : result.releaseType;

				let newReleaseType;

				const commitsWeight = bumpTypesPriority[ suggestedBumpFromCommits ];
				const packagesWeight = bumpTypesPriority[ suggestedBumpFromDependencies ];

				if ( !packagesWeight || commitsWeight > packagesWeight ) {
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

				if ( suggestedBumpFromCommits !== 'skip' ) {
					promise = generateChangelogFromCommits( {
						version,
						currentTag: 'v' + version,
						previousTag: tagName,
						transformCommit: transformCommitFunction,
						isInternalRelease: false,
						additionalNotes: true,
						doNotSave: true
					} );
				}

				return promise.then( changesBasedOnCommits => {
					// Generate the changelog entries based on dependencies.
					let changelogEntries = getChangelogFromDependencies( {
						dependencies,
						newVersion: version,
						currentVersion: packageJson.version,
						repositoryUrl: packageJson.repository.url.replace( /\.git$/, '' ),
					} );

					// Part of the changelog generated from commits should be attached to changelog entries.
					if ( changesBasedOnCommits ) {
						changelogEntries += '\n\n' + changesBasedOnCommits.split( '\n' )
							// First line contains a header which is already generated.
							.slice( 1 )
							.join( '\n' )
							.trim();
					}

					if ( !fs.existsSync( changelogUtils.changelogFile ) ) {
						log.warning( 'Changelog file does not exist. Creating...' );

						changelogUtils.saveChangelog( changelogUtils.changelogHeader );
					}

					let currentChangelog = changelogUtils.getChangelog( repositoryPath );

					// Remove header from current changelog.
					currentChangelog = currentChangelog.replace( changelogUtils.changelogHeader, '' );

					// Concat header, new and current changelog.
					let newChangelog = changelogUtils.changelogHeader + changelogEntries + '\n\n' + currentChangelog.trim();
					newChangelog = newChangelog.trim() + '\n';

					// Save the changelog.
					changelogUtils.saveChangelog( newChangelog, repositoryPath );

					log.info(
						chalk.green( `Changelog for "${ packageJson.name }" (v${ version }) has been generated.` )
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
				log.error( err );
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
			if ( !pathsCollection.skipped.has( currentPackagePath ) && !pathsCollection.packages.has( currentPackagePath ) ) {
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
			const packagePath = getPathToRepository( packageName );
			const nextVersion = versionUtils.getLastFromChangelog( packagePath );
			const currentVersion = versionUtils.getCurrent( packagePath );

			// If "nextVersion" is null, the changelog for the package hasn't been generated.
			if ( !nextVersion ) {
				continue;
			}

			// Changelog contains a version for the future release.
			// Version specified in `package.json` is bumping during the release process,
			// we can assume that the versions are different.
			if ( nextVersion !== currentVersion ) {
				dependenciesVersions.set( packageName, { currentVersion, nextVersion } );
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
			'### Dependencies',
			''
		];

		const allowBreakingChangeInMinor = areBreakingChangesAcceptable( options.newVersion );
		const newPackages = getNewPackages( options.dependencies );

		// We need to remove new packages from the whole collection
		// because we don't want to have duplicates (as minor or major) release.
		for ( const [ packageName ] of newPackages ) {
			options.dependencies.delete( packageName );
		}

		const majorReleasePackages = getMajorReleasePackages( options.dependencies );
		const minorReleasePackages = getMinorReleasePackages( options.dependencies );
		const patchReleasePackages = getPatchReleasePackages( options.dependencies );

		// If the next release is below the `1.0.0` version, we accept breaking changes in `major` releases.
		if ( allowBreakingChangeInMinor ) {
			for ( const [ packageName, versions ] of majorReleasePackages ) {
				minorReleasePackages.set( packageName, versions );
				majorReleasePackages.delete( packageName );
			}
		}

		if ( newPackages.size ) {
			entries.push( 'New packages:\n' );

			for ( const [ packageName, { nextVersion } ] of newPackages ) {
				entries.push( formatChangelogEntry( packageName, nextVersion ) );
			}

			entries.push( '' );
		}

		if ( majorReleasePackages.size ) {
			entries.push( 'Major releases (contain breaking changes):\n' );

			for ( const [ packageName, { currentVersion, nextVersion } ] of majorReleasePackages ) {
				entries.push( formatChangelogEntry( packageName, nextVersion, currentVersion ) );
			}

			entries.push( '' );
		}

		if ( minorReleasePackages.size ) {
			if ( allowBreakingChangeInMinor ) {
				entries.push( 'Minor releases (possible breaking changes):\n' );
			} else {
				entries.push( 'Minor releases:\n' );
			}

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
		return filterPackages( dependencies, ( packageName, currentVersion ) => {
			return semver.eq( currentVersion, '0.0.1' );
		} );
	}

	// Returns a collection of packages which the future release is marked as "major".
	//
	// @params {Map} dependencies
	// @returns {Map}
	function getMajorReleasePackages( dependencies ) {
		return filterPackages( dependencies, ( packageName, currentVersion, nextVersion ) => {
			const versionDiff = semver.diff( currentVersion, nextVersion );

			return versionDiff === 'major' || versionDiff === 'premajor' || versionDiff === 'prerelease';
		} );
	}

	// Returns a collection of packages which the future release is marked as "minor".
	//
	// @params {Map} dependencies
	// @returns {Map}
	function getMinorReleasePackages( dependencies ) {
		return filterPackages( dependencies, ( packageName, currentVersion, nextVersion ) => {
			const versionDiff = semver.diff( currentVersion, nextVersion );

			return versionDiff === 'minor' || versionDiff === 'preminor';
		} );
	}

	// Returns a collection of packages which the future release is marked as "patch".
	//
	// @params {Map} dependencies
	// @returns {Map}
	function getPatchReleasePackages( dependencies ) {
		return filterPackages( dependencies, ( packageName, currentVersion, nextVersion ) => {
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

		for ( const [ packageName, { currentVersion, nextVersion } ] of dependencies ) {
			if ( callback( packageName, currentVersion, nextVersion ) ) {
				packages.set( packageName, { currentVersion, nextVersion } );
			}
		}

		return packages;
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
	function areBreakingChangesAcceptable( version ) {
		// For any version above the `1.0.0`, breaking changes mean that "major" version will be bumped.
		if ( !semver.gt( '1.0.0', version ) ) {
			return false;
		}

		// "prerelease" below `1.0.0` should be parsed as "major" release.
		return semver.diff( version, '1.0.0' ) !== 'prerelease';
	}
};
