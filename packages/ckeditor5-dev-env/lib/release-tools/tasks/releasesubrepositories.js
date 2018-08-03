/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const chalk = require( 'chalk' );
const { tools, logger } = require( '@ckeditor/ckeditor5-dev-utils' );
const parseGithubUrl = require( 'parse-github-url' );
const cli = require( '../utils/cli' );
const createGithubRelease = require( '../utils/creategithubrelease' );
const displaySkippedPackages = require( '../utils/displayskippedpackages' );
const executeOnPackages = require( '../utils/executeonpackages' );
const { getChangesForVersion } = require( '../utils/changelog' );
const { getLastFromChangelog: getLastVersionFromChangelog } = require( '../utils/versions' );
const getPackageJson = require( '../utils/getpackagejson' );
const getPackagesToRelease = require( '../utils/getpackagestorelease' );
const getSubRepositoriesPaths = require( '../utils/getsubrepositoriespaths' );
const updateDependenciesVersions = require( '../utils/updatedependenciesversions' );
const validatePackageToRelease = require( '../utils/validatepackagetorelease' );
const GitHubApi = require( '@octokit/rest' );

const BREAK_RELEASE_MESSAGE = 'You aborted publishing the release. Why? Oh why?!';

// That files will be copied from source to template directory and will be released too.
const additionalFiles = [
	'CHANGELOG.md',
	'LICENSE.md',
	'README.md'
];

/**
 * Releases all sub-repositories (packages) found in specified path.
 *
 * This task does:
 *   - finds paths to sub repositories,
 *   - filters packages which should be released,
 *   - publishes new version on NPM,
 *   - pushes new version to the remote repository,
 *   - creates a release which is displayed on "Releases" page on GitHub.
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
 * @param {Boolean} [options.dryRun=false] If set on true, nothing will be published:
 *   - npm pack will be called instead of npm publish (it packs the whole release to a ZIP archive),
 *   - "git push" will be replaced with a log on the screen,
 *   - creating a release on GitHub will be replaced with a log on the screen,
 *   - every called command will be displayed.
 * @param {Boolean} [options.skipMainRepository=false] If set on true, package found in "cwd" will be skipped.
 * @param {Array.<String>>} [options.emptyReleases=[]] Name of packages that should be published as an empty directory
 * except the real content from repository.
 * @param {Object} [options.packageJsonForEmptyReleases={}] Additional fields that will be added to `package.json` for packages which
 * will publish an empty directory. All properties copied from original package's "package.json" file will be overwritten by fields
 * specified in this option.
 * @param {Boolean} [options.skipMainRepository=false] If set on true, package found in "cwd" will be skipped.
 * @returns {Promise}
 */
module.exports = async function releaseSubRepositories( options ) {
	const cwd = process.cwd();
	const log = logger();
	const dryRun = Boolean( options.dryRun );

	const pathsCollection = getSubRepositoriesPaths( {
		cwd: options.cwd,
		packages: options.packages,
		skipPackages: options.skipPackages || [],
		skipMainRepository: options.skipMainRepository
	} );

	const github = new GitHubApi( {
		version: '3.0.0'
	} );

	logProcess( 'Configuring the release...' );
	const releaseOptions = await cli.configureReleaseOptions();

	// Collections of paths where different kind of releases should be done.
	// `releaesNpm` - the release on NPM that contains the entire repository (npm publish is executed inside the repository)
	// `emptyReleasesNpm` - the release on NPM that contains an empty repository (npm publish is executed from a temporary directory)
	// `releasesGithub` - the release on GitHub (there is only one command called - `git push` and creating the release via REST API)
	const releaesNpm = new Set();
	const emptyReleasesNpm = new Set();
	const releasesGithub = new Set();

	if ( !releaseOptions.npm && !releaseOptions.github) {
		throw BREAK_RELEASE_MESSAGE;
	}

	if ( releaseOptions.github ) {
		github.authenticate( {
			token: releaseOptions.token,
			type: 'oauth',
		} );
	}

	return preparePackagesToRelease()
		.then( packages => filterPackagesToReleaseOnNpm( packages ) )
		.then( packages => filterPackagesToReleaseOnGitHub( packages ) )
		.then( packages => null /* prepare directories for packages that are specified in "emptyRelease" */ )
		.then( packages => null /* release on NPM packages from "releaesNpm" */ )
		.then( packages => null /* release on NPM packages from "emptyReleasesNpm" */ )
		.then( packages => null /* release on NPM packages from "releasesGithub" */ )
		;

	// Prepares a version, a description and other necessary things that must be done before starting
	// the entire a releasing process.
	//
	// @returns {Promise.<Map>}
	function preparePackagesToRelease() {
		logProcess( 'Preparing packages that will be released...' );

		const packages = new Map();

		return executeOnPackages( pathsCollection.matched, repositoryPath => {
			process.chdir( repositoryPath );

			const packageJson = getPackageJson( repositoryPath );
			const releaseDetails = {
				version: packageJson.version,
				changes: getChangesForVersion( packageJson.version, repositoryPath )
			};

			packages.set( packageJson.name, releaseDetails );

			if ( releaseOptions.github ) {
				const repositoryInfo = parseGithubUrl(
					exec( 'git remote get-url origin --push' ).trim()
				);

				releaseDetails.repositoryOwner = repositoryInfo.owner;
				releaseDetails.repositoryName = repositoryInfo.name;
			}

			return Promise.resolve();
		} ).then( () => packages );
	}

	// Checks which packages should be published on NPM. It compares version defined in `package.json`
	// and the latest released on NPM.
	//
	// @returns {Promise.<Map>}
	function filterPackagesToReleaseOnNpm( packages ) {
		if ( !releaseOptions.npm ) {
			return Promise.resolve( packages );
		}

		logProcess( 'Collecting the latest versions of packages published on NPM...' );

		return executeOnPackages( pathsCollection.matched, repositoryPath => {
			process.chdir( repositoryPath );

			const packageJson = getPackageJson( repositoryPath );
			const releaseDetails = packages.get( packageJson.name );

			log.info( `Checking "${ chalk.underline( packageJson.name ) }"...` );

			const npmVersion = exec( `npm show ${ packageJson.name } version` ).trim();

			logDryRun( `Versions: package.json: "${ releaseDetails.version  }", npm: "${ npmVersion }".` );

			if ( npmVersion !== releaseDetails.version ) {
				logDryRun( 'Package will be released.' );

				releaesNpm.add( repositoryPath );
			} else {
				log.info( 'Nothing to release.' )
			}

			releaseDetails.npmVersion = npmVersion;

			return Promise.resolve();
		} ).then( () => packages );
	}

	// Checks for which packages GitHub release should be created. It compares version defined in `package.json`
	// and the latest release on GitHub.
	//
	// @returns {Promise.<Map>}
	function filterPackagesToReleaseOnGitHub( packages ) {
		if ( !releaseOptions.github ) {
			return Promise.resolve( packages );
		}

		logProcess( 'Collecting the latest releases published on GitHub...' );

		return executeOnPackages( pathsCollection.matched, repositoryPath => {
			process.chdir( repositoryPath );

			const packageJson = getPackageJson( repositoryPath );
			const releaseDetails = packages.get( packageJson.name );

			log.info( `Checking "${ chalk.underline( packageJson.name ) }"...` );

			return getLastRelease( releaseDetails.repositoryOwner, releaseDetails.repositoryName )
				.then( ( { data } ) => {
					const githubVersion = data.tag_name.replace( /^v/, '' );

					logDryRun( `Versions: package.json: "${ releaseDetails.version  }", GitHub: "${ githubVersion }".` );

					if ( githubVersion !== releaseDetails.version ) {
						logDryRun( 'Package will be published.' );

						releasesGithub.add( repositoryPath );
					} else {
						log.info( 'Nothing to publish.' )
					}

					releaseDetails.githubVersion = githubVersion;
				} )
				.catch( err => {
					log.warning( err );
				} );
		} ).then( () => packages );

		function getLastRelease( repositoryOwner, repositoryName ) {
			const requestParams = {
				owner: repositoryOwner,
				repo: repositoryName
			};

			return new Promise( ( resolve, reject ) => {
				github.repos.getLatestRelease( requestParams, ( err, responses ) => {
					if ( err ) {
						return reject( err );
					}

					return resolve( responses );
				} );
			} );
		}
	}

	// Pushes all changes to remote.
	//
	// @params {Map.<String, ReleaseDetails>} packages
	// @returns {Promise.<Map.<String, ReleaseDetails>>}
	function pushPackages( packages ) {
		logProcess( 'Pushing packages to the remote...' );

		return executeOnPackages( pathsCollection.matched, repositoryPath => {
			process.chdir( repositoryPath );

			const packageJson = getPackageJson( repositoryPath );
			const releaseDetails = packages.get( packageJson.name );

			log.info( `\nPushing "${ chalk.underline( packageJson.name ) }" package...` );

			if ( dryRun ) {
				logDryRun( `Command: "git push origin master v${ releaseDetails.version }" would be executed.` );
			} else {
				exec( `git push origin master v${ releaseDetails.version }` );
			}

			return Promise.resolve();
		} ).then( () => packages );
	}










	// ----------------------------------------------------------------------------------------------------------------

	// These variables will be set during the function's execution.
	// List of packages to release; packages and their versions; options provided by the user (CLI).
	// let packagesToRelease, dependencies, releaseOptions;

	// Errors are added to this array by the `validateRepositories` function.
	const errors = [];

	if ( dryRun ) {
		log.info( chalk.bold( chalk.yellow( '[DRY RUN mode]\n' ) ) );
	}

	log.info( chalk.blue( 'Collecting packages that will be released...' ) );

	return getPackagesToRelease( pathsCollection.matched )
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
			for ( const pathToPackage of pathsCollection.matched ) {
				const packageName = getPackageJson( pathToPackage ).name;

				// The main package won't be released but we need to keep its version in order to update peerDependencies.
				if ( packageName === mainPackageJson.name ) {
					continue;
				}

				if ( !packagesToRelease.has( packageName ) ) {
					pathsCollection.matched.delete( pathToPackage );
				}
			}

			return updateDependenciesOfPackagesToRelease();
		} )
		.then( () => getLatestChangesForPackagesThatWillBeReleased() )
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
		.then( () => {
			process.chdir( cwd );

			log.info( chalk.green( `Finished releasing ${ pathsCollection.matched.size } packages.` ) );
		} )
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

		for ( const packagePath of pathsCollection.matched ) {
			const packageJson = getPackageJson( packagePath );

			if ( !dependencies.has( packageJson.name ) ) {
				dependencies.set( packageJson.name, packageJson.version );
			}
		}

		// Add main package (it could be added as a peer-dependency).
		dependencies.set( mainPackageJson.name, mainPackageChangelogVersion );

		return dependencies;
	}

	function updateDependenciesOfPackagesToRelease() {
		return executeOnPackages( pathsCollection.matched, repositoryPath => {
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

	function getLatestChangesForPackagesThatWillBeReleased() {
		return executeOnPackages( pathsCollection.matched, repositoryPath => {
			process.chdir( repositoryPath );

			const packageJson = getPackageJson( repositoryPath );
			const releaseDetails = packagesToRelease.get( packageJson.name );

			const version = releaseDetails.version;

			releaseDetails.changes = getChangesForVersion( version, repositoryPath );

			return Promise.resolve();
		} );
	}

	function validateRepositories() {
		return executeOnPackages( pathsCollection.matched, repositoryPath => {
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
		return executeOnPackages( pathsCollection.matched, repositoryPath => {
			process.chdir( repositoryPath );

			const packageJson = getPackageJson( repositoryPath );
			const releaseDetails = packagesToRelease.get( packageJson.name );

			log.info( `Bumping version for "${ packageJson.name }"...` );

			const commitMessage = `--message "Release: v${ releaseDetails.version }. [skip ci]"`;
			let versionCommand = `npm version ${ releaseDetails.version }`;

			if ( dryRun ) {
				// `npm version` creates a Git tag by default. Adding "--no-git-tag-version" option will disable committing and tagging.
				versionCommand += ` --no-git-tag-version && git add package.json && git commit ${ commitMessage }`;
			} else {
				// Attach a message to the release commit.
				versionCommand += ` ${ commitMessage }`;
			}

			exec( versionCommand );

			return Promise.resolve();
		} );
	}

	function releaseOnNpm() {
		if ( releaseOptions.skipNpm ) {
			return Promise.resolve();
		}

		return executeOnPackages( pathsCollection.matched, repositoryPath => {
			process.chdir( repositoryPath );

			const packageJson = getPackageJson( repositoryPath );

			log.info( `Publishing on NPM "${ packageJson.name }"...` );

			if ( dryRun ) {
				exec( 'npm pack' );
			} else {
				exec( 'npm publish --access=public' );
			}
		} );
	}

	function pushRepositories() {
		return executeOnPackages( pathsCollection.matched, repositoryPath => {
			process.chdir( repositoryPath );

			const packageJson = getPackageJson( repositoryPath );
			log.info( `Pushing a local repository into the remote for "${ packageJson.name }"...` );

			if ( dryRun ) {
				exec( 'echo "Pushing the repository to the remote..."' );
			} else {
				exec( 'git push' );
			}

			return Promise.resolve();
		} );
	}

	function releaseOnGithub() {
		if ( releaseOptions.skipGithub ) {
			return Promise.resolve();
		}

		return executeOnPackages( pathsCollection.matched, repositoryPath => {
			process.chdir( repositoryPath );

			const packageJson = getPackageJson( repositoryPath );
			const releaseDetails = packagesToRelease.get( packageJson.name );

			log.info( `Creating a GitHub release for "${ packageJson.name }"...` );

			const repositoryInfo = parseGithubUrl(
				exec( 'git remote get-url origin --push' ).trim()
			);

			const url = `https://github.com/${ repositoryInfo.owner }/${ repositoryInfo.name }/releases/tag/v${ releaseDetails.version }`;

			if ( dryRun ) {
				log.info( `Created release will be available under: ${ chalk.green( url ) }` );

				return Promise.resolve();
			}

			const githubReleaseOptions = {
				repositoryOwner: repositoryInfo.owner,
				repositoryName: repositoryInfo.name,
				version: `v${ releaseDetails.version }`,
				description: releaseDetails.changes
			};

			return createGithubRelease( releaseOptions.token, githubReleaseOptions )
				.then(
					() => {
						// eslint-disable-next-line max-len
						log.info( `Created the release: ${ chalk.green( url ) }` );

						return Promise.resolve();
					},
					err => {
						log.info( 'Cannot create a release on GitHub. Skipping that package.' );
						log.error( err );

						return Promise.resolve();
					}
				);
		} );
	}

	// ---------------------------------------------------------------------------------------------------------------------

	function exec( command ) {
		if ( dryRun ) {
			log.info( `⚠️  ${ chalk.grey( 'Execute:' ) } "${ chalk.cyan( command ) }" in "${ chalk.grey.italic( process.cwd() ) }".` );
		}

		return tools.shExec( command, { verbosity: 'error' } );
	}

	function logProcess( message ) {
		log.info( '\n📍  ' + chalk.blue( message ) );
	}

	function logDryRun( message ) {
		if ( dryRun ) {
			log.info( 'ℹ️  ' + chalk.yellow( message ) );
		}
	}
};
