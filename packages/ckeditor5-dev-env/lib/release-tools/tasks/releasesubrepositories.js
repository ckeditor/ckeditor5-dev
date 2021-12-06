/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const chalk = require( 'chalk' );
const glob = require( 'glob' );
const mkdirp = require( 'mkdirp' );
const { tools, logger } = require( '@ckeditor/ckeditor5-dev-utils' );
const parseGithubUrl = require( 'parse-github-url' );
const cli = require( '../utils/cli' );
const createGithubRelease = require( '../utils/creategithubrelease' );
const displaySkippedPackages = require( '../utils/displayskippedpackages' );
const executeOnPackages = require( '../utils/executeonpackages' );
const { getChangesForVersion } = require( '../utils/changelog' );
const getPackageJson = require( '../utils/getpackagejson' );
const getPackagesPaths = require( '../utils/getpackagespaths' );
const { Octokit } = require( '@octokit/rest' );

const PACKAGE_JSON_TEMPLATE_PATH = require.resolve( '../templates/release-package.json' );
const BREAK_RELEASE_MESSAGE = 'You aborted publishing the release. Why? Oh why?!';
const NO_RELEASE_MESSAGE = 'No changes for publishing. Why? Oh why?!';
const AUTH_REQUIRED = 'You must be logged to execute this command.';

// That files will be copied from source to the temporary directory and will be released too.
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
 *   - filters packages which should be released by comparing the latest version published on npm and GitHub,
 *   - publishes new version on npm,
 *   - pushes new version to the remote repository,
 *   - creates a release which is displayed on "Releases" page on GitHub.
 *
 * If you want to publish an empty repository (it will contain required files for npm), you can specify the package name
 * as `options.customReleases`. Packages specified in the array will be published from temporary directory. `package.json` of that package
 * will be created based on a template. See `packages/ckeditor5-dev-env/lib/release-tools/templates/release-package.json` file.
 *
 * Content of `package.json` can be adjusted using `options.packageJsonForCustomReleases` options. If you need to copy values from
 * real `package.json` that are not defined in template, you can add these keys as null. Values will be copied automatically.
 *
 * If you want to add files from the source package directory to the temporary directory, you can use the
 * `options.customReleasesFiles` option.
 *
 * Example usage:
 *
 *     require( '@ckeditor/ckeditor5-dev-env' )
 *         .releaseSubRepositories( {
 *		        cwd: process.cwd(),
 *		        packages: 'packages',
 *		        customReleases: [
 *			        'ckeditor5' // "ckeditor5" will be released as an empty repository.
 *		        ],
 *		        packageJsonForCustomReleases: {
 *			        ckeditor5: { // These properties will overwrite those ones that are defined in package's `package.json`
 *				        description: 'Custom description', // "description" of real package will be overwritten.
 *				        devDependencies: null // The template does not contain "devDependencies" but we want to add it.
 *			        }
 *		        },
 *		        customReleasesFiles: {
 *			        ckeditor5: [ // An array of glob patterns. Files that match to those patterns will be released.
 *				        'src/*.js' // Copy all JS files from the `src/` directory.
 *				        'scripts/**' // Copy everything from the `script/` directory.
 *			        ]
 *		        },
 *		        dryRun: process.argv.includes( '--dry-run' )
 *	} );
 *
 * Pushes are done at the end of the whole process because of Continues Integration. We need to publish all
 * packages on npm before starting the CI testing. If we won't do it, CI will fail because it won't be able
 * to install packages which versions will match to specified in `package.json`.
 * See {@link https://github.com/ckeditor/ckeditor5-dev/issues/272}.
 *
 * @param {Object} options
 *
 * @param {String} options.cwd Current working directory (packages) from which all paths will be resolved.
 *
 * @param {String|null} options.packages Where to look for other packages (dependencies). If `null`, only repository specified under
 * `options.cwd` will be used in the task.
 *
 * @param {Array.<String>} [options.skipPackages=[]] Name of packages which won't be released.
 *
 * @param {Boolean} [options.dryRun=false] If set on true, nothing will be published:
 *   - npm pack will be called instead of npm publish (it packs the whole release to a ZIP archive),
 *   - "git push" will be replaced with a log on the screen,
 *   - creating a release on GitHub will be replaced with a log on the screen,
 *   - every called command will be displayed.
 *
 * @param {Boolean} [options.skipMainRepository=false] If set on true, package found in "cwd" will be skipped.
 *
 * @param {Array.<String>>} [options.customReleases=[]] Name of packages that should be published from the temporary directory
 * instead of the package directory. It was used for publishing an empty package (with files that are required for npm). By using
 * the `options.packageJsonForCustomReleases`, you can specify the content for the `package.json` file. By using
 * the `options.customReleasesFiles` option, you can specify which files should be copied to the temporary directory.
 *
 * @param {Object} [options.packageJsonForCustomReleases={}] Additional fields that will be added to `package.json` for packages which
 * will be published using the custom release option. All properties copied from original package's `package.json` file
 * will be overwritten by fields specified in this option.
 *
 * @param {Object} [options.customReleasesFiles={}] Glob patterns of files that will be copied to the temporary for packages which
 * will be published using the custom release option.
 *
 * @param {Array.<String>} [options.skipNpmPublish=[]] Name of packages that should not be published on npm.
 *
 * @param {String} [options.releaseBranch='master'] A name of the branch that should be used for releasing packages.
 *
 * @returns {Promise}
 */
module.exports = function releaseSubRepositories( options ) {
	const cwd = process.cwd();
	const log = logger();

	const dryRun = Boolean( options.dryRun );
	const releaseBranch = options.releaseBranch || 'master';
	const customReleases = Array.isArray( options.customReleases ) ? options.customReleases : [ options.customReleases ].filter( Boolean );

	const pathsCollection = getPackagesPaths( {
		cwd: options.cwd,
		packages: options.packages,
		skipPackages: options.skipPackages || [],
		skipMainRepository: options.skipMainRepository
	} );

	logDryRun( '⚠️  DRY RUN mode ⚠️' );
	logDryRun( 'The script WILL NOT publish anything but will create some files.' );

	// The variable is set only if "release on github" option has been chosen during configuration the release.
	// See `configureRelease()` function.
	let github;

	// Collections of paths where different kind of releases should be done.
	// - `releasesOnNpm` - the release on npm that contains the entire repository (npm publish is executed inside the repository)
	// - `customReleasesOnNpm` - the release on npm that contains a specified files instead of the entire content of the package.
	//    For this releases, the `npm publish` command is executed from a temporary directory.
	// - `releasesOnGithub` - the release on GitHub (there is only one command called - `git push` and creating the release via REST API)
	const releasesOnNpm = new Set();
	const releasesOnGithub = new Set();
	const customReleasesOnNpm = new Map();

	// A list of packages that should not be published on npm.
	const skipNpmPublish = new Set( options.skipNpmPublish || [] );

	// List of packages that were released on npm or/and GitHub.
	const releasedPackages = new Set();

	// List of files that should be removed in DRY RUN mode. This is a result of command `npm pack`.
	const filesToRemove = new Set();

	// List of all details required for releasing packages.
	const packages = new Map();

	let releaseOptions;

	return configureRelease()
		.then( _releaseOptions => saveReleaseOptions( _releaseOptions ) )
		.then( () => authCheck() )
		.then( () => preparePackagesToRelease() )
		.then( () => filterPackagesToReleaseOnNpm() )
		.then( () => filterPackagesToReleaseOnGitHub() )
		.then( () => confirmRelease() )
		.then( () => prepareDirectoriesForCustomReleases() )
		.then( () => releasePackagesOnNpm() )
		.then( () => pushPackages() )
		.then( () => createReleasesOnGitHub() )
		.then( () => removeTemporaryDirectories() )
		.then( () => removeReleaseArchives() )
		.then( () => {
			process.chdir( cwd );

			logProcess( `Finished releasing ${ chalk.underline( releasedPackages.size ) } package(s).` );
			logDryRun( 'Because of the DRY RUN mode, nothing has been changed. All changes were reverted.' );

			// For the real release from non-master branch, show the "merge" tip.
			if ( !dryRun && releaseBranch !== 'master' ) {
				log.info( '⚠️  ' + chalk.underline( `Do not forget about merging "${ releaseBranch }" to the "master".` ) );
			}
		} )
		.catch( err => {
			process.chdir( cwd );

			if ( err instanceof Error ) {
				let message;

				switch ( err.message ) {
					case BREAK_RELEASE_MESSAGE:
						message = 'Publishing has been aborted.';
						break;
					case NO_RELEASE_MESSAGE:
						message = 'There is nothing to release. The process was aborted.';
						break;
					case AUTH_REQUIRED:
						message = 'Before you starting releasing, you need to login to npm.';
						break;
				}

				if ( message ) {
					logProcess( message );

					return Promise.resolve();
				}
			}

			log.error( dryRun ? err.stack : err.message );

			process.exitCode = -1;
		} );

	// Configures release options.
	//
	// @returns {Promise.<Object>}
	function configureRelease() {
		logProcess( 'Configuring the release...' );

		return cli.configureReleaseOptions();
	}

	// Saves the options provided by a user.
	//
	// @param {Object} _releaseOptions
	function saveReleaseOptions( _releaseOptions ) {
		releaseOptions = _releaseOptions;

		if ( !releaseOptions.npm && !releaseOptions.github ) {
			throw new Error( BREAK_RELEASE_MESSAGE );
		}

		if ( releaseOptions.github ) {
			// Because `octokit.authenticate()` is deprecated, the entire API object is created here.
			github = new Octokit( {
				version: '3.0.0',
				auth: `token ${ releaseOptions.token }`
			} );
		}
	}

	// Checks whether to a user is logged to npm.
	//
	// @returns {Promise}
	function authCheck() {
		if ( !releaseOptions.npm ) {
			return Promise.resolve();
		}

		logProcess( 'Checking whether you are logged to npm...' );

		try {
			const whoami = exec( 'npm whoami' );

			log.info( `🔑 Logged as "${ chalk.underline( whoami.trim() ) }".` );

			return Promise.resolve();
		} catch ( err ) {
			logDryRun( '⛔️ You are not logged to npm. ⛔️' );
			logDryRun( chalk.italic( 'But this is a DRY RUN so you can continue safely.' ) );

			if ( dryRun ) {
				return Promise.resolve();
			}

			return Promise.reject( new Error( AUTH_REQUIRED ) );
		}
	}

	// Prepares a version, a description and other necessary things that must be done before starting
	// the entire a releasing process.
	//
	// @returns {Promise}
	function preparePackagesToRelease() {
		logProcess( 'Preparing packages that will be released...' );

		displaySkippedPackages( pathsCollection.skipped );

		return Promise.resolve()
			.then( () => {
				// Prepare the main repository release details.
				const packageJson = getPackageJson( options.cwd );
				const releaseDetails = {
					version: packageJson.version
				};

				if ( releaseOptions.github ) {
					const repositoryInfo = parseGithubUrl(
						exec( 'git remote get-url origin --push' ).trim()
					);

					releaseDetails.changes = getChangesForVersion( packageJson.version, options.cwd );
					releaseDetails.repositoryOwner = repositoryInfo.owner;
					releaseDetails.repositoryName = repositoryInfo.name;
				}

				packages.set( packageJson.name, releaseDetails );

				return executeOnPackages( pathsCollection.matched, repositoryPath => {
					// The main repository is handled before calling the `executeOnPackages()` function.
					if ( repositoryPath === options.cwd ) {
						return;
					}

					const packageJson = getPackageJson( repositoryPath );

					packages.set( packageJson.name, {
						version: packageJson.version
					} );

					return Promise.resolve();
				} );
			} )
			.then( () => {
				process.chdir( cwd );
			} );
	}

	// Checks which packages should be published on npm. It compares version defined in `package.json`
	// and the latest released on npm.
	//
	// @returns {Promise}
	function filterPackagesToReleaseOnNpm() {
		if ( !releaseOptions.npm ) {
			return Promise.resolve();
		}

		logProcess( 'Collecting the latest versions of packages published on npm...' );

		return executeOnPackages( pathsCollection.matched, repositoryPath => {
			process.chdir( repositoryPath );

			const packageJson = getPackageJson( repositoryPath );
			const releaseDetails = packages.get( packageJson.name );

			log.info( `\nChecking "${ chalk.underline( packageJson.name ) }"...` );

			if ( skipNpmPublish.has( packageJson.name ) ) {
				log.warning( '⚠️  Skipping because the package was listed as `options.skipNpmPublish`.' );

				releaseDetails.npmVersion = null;
				releaseDetails.shouldReleaseOnNpm = false;

				return Promise.resolve();
			}

			const npmVersion = getVersionFromNpm( packageJson.name );

			logDryRun( `Versions: package.json: "${ releaseDetails.version }", npm: "${ npmVersion || 'initial release' }".` );

			releaseDetails.npmVersion = npmVersion;
			releaseDetails.shouldReleaseOnNpm = npmVersion !== releaseDetails.version;

			if ( releaseDetails.shouldReleaseOnNpm ) {
				log.info( '✅  Added to release.' );

				releasesOnNpm.add( repositoryPath );
			} else {
				log.info( '❌  Nothing to release.' );
			}

			return Promise.resolve();
		} );

		// Checks whether specified `packageName` has been published on npm.
		// If so, returns its version. Otherwise returns `null` which means that
		// this package will be published for the first time.
		function getVersionFromNpm( packageName ) {
			try {
				return exec( `npm show ${ packageName } version` ).trim();
			} catch ( err ) {
				if ( err.message.match( /npm ERR! 404/ ) ) {
					return null;
				}

				throw err;
			}
		}
	}

	// Checks for which packages GitHub release should be created. It compares version defined in `package.json`
	// and the latest release on GitHub.
	//
	// @returns {Promise}
	function filterPackagesToReleaseOnGitHub() {
		if ( !releaseOptions.github ) {
			return Promise.resolve();
		}

		logProcess( 'Collecting the latest releases published on GitHub...' );

		process.chdir( options.cwd );

		const packageJson = getPackageJson( options.cwd );
		const releaseDetails = packages.get( packageJson.name );

		log.info( `\nChecking "${ chalk.underline( packageJson.name ) }"...` );

		return getLastRelease( releaseDetails.repositoryOwner, releaseDetails.repositoryName )
			.then( ( { data } ) => {
				// It can be `null` if there is no releases on GitHub.
				let githubVersion = data.tag_name;

				if ( githubVersion ) {
					githubVersion = data.tag_name.replace( /^v/, '' );
				}

				logDryRun(
					`Versions: package.json: "${ releaseDetails.version }", GitHub: "${ githubVersion || 'initial release' }".`
				);

				releaseDetails.githubVersion = githubVersion;
				releaseDetails.shouldReleaseOnGithub = githubVersion !== releaseDetails.version;

				if ( releaseDetails.shouldReleaseOnGithub ) {
					log.info( '✅  Added to release.' );

					releasesOnGithub.add( options.cwd );
				} else {
					log.info( '❌  Nothing to release.' );
				}
			} )
			.catch( err => {
				log.warning( err );
			} );

		function getLastRelease( repositoryOwner, repositoryName ) {
			const requestParams = {
				owner: repositoryOwner,
				repo: repositoryName
			};

			return github.repos.getLatestRelease( requestParams )
				.catch( err => {
					// If the "last release" returned the 404 error page, it means that this release
					// will be the first one for specified `repositoryOwner/repositoryName` package.
					if ( err.status == 404 ) {
						return Promise.resolve( {
							data: {
								tag_name: null
							}
						} );
					}

					return Promise.reject( err );
				} );
		}
	}

	// Asks a user whether the process should be continued.
	//
	// @params {Map.<String, ReleaseDetails>} packages
	// @returns {Promise}
	function confirmRelease() {
		// No packages for releasing...
		if ( !releasesOnNpm.size && !releasesOnGithub.size ) {
			throw new Error( NO_RELEASE_MESSAGE );
		}

		logProcess( 'Should we continue?' );

		return cli.confirmPublishing( packages )
			.then( isConfirmed => {
				if ( !isConfirmed ) {
					throw new Error( BREAK_RELEASE_MESSAGE );
				}
			} );
	}

	// Prepares custom repositories that will be released.
	//
	// @returns {Promise}
	function prepareDirectoriesForCustomReleases() {
		if ( !releaseOptions.npm ) {
			return Promise.resolve();
		}

		logProcess( 'Preparing directories for custom releases...' );

		const customReleasesFiles = options.customReleasesFiles || {};

		return executeOnPackages( releasesOnNpm, repositoryPath => {
			let promise = Promise.resolve();

			process.chdir( repositoryPath );

			const packageJson = getPackageJson( repositoryPath );

			if ( !customReleases.includes( packageJson.name ) ) {
				return promise;
			}

			log.info( `\nPreparing "${ chalk.underline( packageJson.name ) }"...` );

			const tmpDir = fs.mkdtempSync( repositoryPath + path.sep + '.release-directory-' );
			const tmpPackageJsonPath = path.join( tmpDir, 'package.json' );

			releasesOnNpm.delete( repositoryPath );
			customReleasesOnNpm.set( tmpDir, repositoryPath );

			// Copy `package.json` template.
			promise = promise.then( () => copyFile( PACKAGE_JSON_TEMPLATE_PATH, tmpPackageJsonPath ) );

			// Copy files required by npm.
			for ( const file of additionalFiles ) {
				promise = promise.then( () => copyFile( path.join( repositoryPath, file ), path.join( tmpDir, file ) ) );
			}

			// Copy additional files.
			const customReleasesFilesForPackage = customReleasesFiles[ packageJson.name ] || [];
			const globOptions = {
				cwd: repositoryPath,
				dot: true,
				nodir: true
			};

			for ( const globPattern of customReleasesFilesForPackage ) {
				for ( const file of glob.sync( globPattern, globOptions ) ) {
					promise = promise.then( () => copyFile( path.join( repositoryPath, file ), path.join( tmpDir, file ) ) );
				}
			}

			return promise.then( () => {
				logDryRun( 'Updating package.json...' );

				// Update `package.json` file. It uses values from source `package.json`
				// but only these ones which are defined in the template.
				// Properties that were passed as `options.packageJsonForCustomReleases` will not be overwritten.
				tools.updateJSONFile( tmpPackageJsonPath, jsonFile => {
					const additionalPackageJson = options.packageJsonForCustomReleases[ packageJson.name ] || {};

					// Overwrite custom values specified in `options.packageJsonForCustomReleases`.
					for ( const property of Object.keys( additionalPackageJson ) ) {
						jsonFile[ property ] = additionalPackageJson[ property ];
					}

					// Copy values from original package.json file.
					for ( const property of Object.keys( jsonFile ) ) {
						// If the `property` is set, leave it.
						if ( jsonFile[ property ] ) {
							continue;
						}

						jsonFile[ property ] = packageJson[ property ];
					}

					return jsonFile;
				} );
			} );
		} );
	}

	// Publishes all packages on npm. In `dry run` mode it will create an archive instead of publishing the package.
	//
	// @returns {Promise}
	function releasePackagesOnNpm() {
		if ( !releaseOptions.npm ) {
			return Promise.resolve();
		}

		logProcess( 'Publishing on npm...' );

		const paths = [
			...customReleasesOnNpm.keys(),
			...releasesOnNpm
		];

		return executeOnPackages( paths, repositoryPath => {
			process.chdir( repositoryPath );

			const packageJson = getPackageJson( repositoryPath );

			log.info( `\nPublishing "${ chalk.underline( packageJson.name ) }" as "v${ packageJson.version }"...` );
			logDryRun( 'Do not panic. DRY RUN mode is active. An archive with the release will be created instead.' );

			const repositoryRealPath = customReleasesOnNpm.get( repositoryPath ) || repositoryPath;

			if ( dryRun ) {
				const archiveName = packageJson.name.replace( '@', '' ).replace( '/', '-' ) + `-${ packageJson.version }.tgz`;

				exec( 'npm pack' );

				// Move created archive from temporary directory because the directory will be removed automatically.
				if ( customReleasesOnNpm.has( repositoryPath ) ) {
					exec( `mv ${ path.join( repositoryPath, archiveName ) } ${ path.resolve( repositoryRealPath ) }` );
				}

				// Mark created archive as a file to remove.
				filesToRemove.add( path.join( repositoryRealPath, archiveName ) );
			} else {
				exec( 'npm publish --access=public' );
			}

			releasedPackages.add( repositoryRealPath );
		} );
	}

	// Pushes all changes to remote.
	//
	// @params {Map.<String, ReleaseDetails>} packages
	// @returns {Promise}
	function pushPackages() {
		logProcess( 'Pushing packages to the remote...' );

		process.chdir( options.cwd );

		const packageJson = getPackageJson( options.cwd );
		const releaseDetails = packages.get( packageJson.name );

		log.info( `\nPushing "${ chalk.underline( packageJson.name ) }" package...` );

		if ( dryRun ) {
			logDryRun( `Command: "git push origin ${ releaseBranch } v${ releaseDetails.version }" would be executed.` );
		} else {
			exec( `git push origin ${ releaseBranch } v${ releaseDetails.version }` );
		}

		return Promise.resolve();
	}

	// Creates the releases on GitHub. In `dry run` mode it will just print a URL to release.
	//
	// @returns {Promise}
	function createReleasesOnGitHub() {
		if ( !releaseOptions.github ) {
			return Promise.resolve();
		}

		logProcess( 'Creating releases on GitHub...' );

		process.chdir( options.cwd );

		const packageJson = getPackageJson( options.cwd );
		const releaseDetails = packages.get( packageJson.name );

		log.info( `\nCreating a GitHub release for "${ packageJson.name }"...` );

		// eslint-disable-next-line max-len
		const url = `https://github.com/${ releaseDetails.repositoryOwner }/${ releaseDetails.repositoryName }/releases/tag/v${ releaseDetails.version }`;

		logDryRun( `Created release will be available under: ${ chalk.underline( url ) }` );

		if ( dryRun ) {
			return Promise.resolve();
		}

		const githubReleaseOptions = {
			repositoryOwner: releaseDetails.repositoryOwner,
			repositoryName: releaseDetails.repositoryName,
			version: `v${ releaseDetails.version }`,
			description: releaseDetails.changes
		};

		return createGithubRelease( releaseOptions.token, githubReleaseOptions )
			.then(
				() => {
					releasedPackages.add( options.cwd );

					log.info( `Created the release: ${ chalk.green( url ) }` );

					return Promise.resolve();
				},
				err => {
					log.info( 'Cannot create a release on GitHub. Skipping that package.' );
					log.error( err );

					return Promise.resolve();
				}
			);
	}

	// Removes all temporary directories that were created for publishing the custom repository.
	//
	// @returns {Promise}
	function removeTemporaryDirectories() {
		if ( !releaseOptions.npm ) {
			return Promise.resolve();
		}

		logProcess( 'Removing temporary directories that were created for publishing on npm...' );

		return executeOnPackages( customReleasesOnNpm.keys(), repositoryPath => {
			process.chdir( customReleasesOnNpm.get( repositoryPath ) );

			exec( `rm -rf ${ repositoryPath }` );
		} );
	}

	// Asks the user whether created archives should be removed. It so, the script will remove them.
	//
	// @returns {Promise}
	function removeReleaseArchives() {
		// This step should be skipped if packages won't be released on npm or if dry run mode is disabled.
		if ( !releaseOptions.npm || !dryRun ) {
			return Promise.resolve();
		}

		logProcess( 'Removing archives created by "npm pack" command...' );

		return cli.confirmRemovingFiles()
			.then( shouldRemove => {
				process.chdir( cwd );

				if ( !shouldRemove ) {
					logDryRun( 'You can remove these files manually by calling `git clean -f` command.' );

					return;
				}

				for ( const file of filesToRemove ) {
					exec( `rm ${ file }` );
				}
			} );
	}

	/**
	 * Copy a file from the `source` path to the `destination` path.
	 *
	 * @param {String} source
	 * @param {String} destination
	 * @returns {Promise}
	 */
	function copyFile( source, destination ) {
		return new Promise( ( resolve, reject ) => {
			if ( dryRun ) {
				log.info(
					`ℹ️  ${ chalk.grey( 'Copy file:' ) } From: "${ chalk.italic( source ) }" to "${ chalk.italic( destination ) }".`
				);
			}

			mkdirp.sync( path.dirname( destination ) );

			const stream = fs.createReadStream( source )
				.pipe( fs.createWriteStream( destination ) );

			stream.on( 'finish', resolve );
			stream.on( 'error', reject );
		} );
	}

	function exec( command ) {
		if ( dryRun ) {
			log.info( `ℹ️  ${ chalk.grey( 'Execute:' ) } "${ chalk.cyan( command ) }" in "${ chalk.grey.italic( process.cwd() ) }".` );
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
