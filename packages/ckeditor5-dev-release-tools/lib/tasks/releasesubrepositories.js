/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const chalk = require( 'chalk' );
const glob = require( 'glob' );
const mkdirp = require( 'mkdirp' );
const semver = require( 'semver' );
const Table = require( 'cli-table' );
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
const MISSING_FILES_MESSAGE =
	'Publishing the release is terminated by you.\n' +
	'Some files were expected to exist, but they were not found in the directory structure of the package.\n\n' +
	'👉 Next step: Take a deep breath and think why the package does not have the necessary files.\n\n' +
	'👉 Workarounds:\n' +
	'   (1) Run the script once again and accept the package with missing files.\n' +
	'       BE CAREFUL: the package will be published as it is now.\n' +
	'   (2) Consider adding the package to exceptions in `options.skipNpmPublish`.\n';

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
 * will be created based on a template. See `packages/ckeditor5-dev-release-tools/lib/templates/release-package.json` file.
 *
 * Content of `package.json` can be adjusted using `options.packageJsonForCustomReleases` options. If you need to copy values from
 * real `package.json` that are not defined in template, you can add these keys as null. Values will be copied automatically.
 *
 * If you want to add files from the source package directory to the temporary directory, you can use the
 * `options.customReleasesFiles` option.
 *
 * Example usage:
 *
 *     require( '@ckeditor/ckeditor5-release-tools' )
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
 * @param {String} [options.npmTag='latest'] Defines an npm tag which the package manager will use when installing the package.
 * Read more: https://docs.npmjs.com/cli/v8/commands/npm-publish#tag.
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
 * @param {Object} [options.optionalFilesAndDirectories=null] By default, for each package that we want to publish,
 * the tool checks whether all files specified in the `#files` key (in `package.json`) exist. The option allows defining
 * items that does not have to exist, e.g., the `theme/` directory is optional because CKEditor 5 features do not have to define styles.
 * The `lang/` directory also a good example, as only some of packages can be localized.
 *
 * The `options.optionalFilesAndDirectories` object may contain keys that are package names. The `#default` key is used for all packages
 * that do not have own key.
 *
 * @returns {Promise}
 */
module.exports = async function releaseSubRepositories( options ) {
	const cwd = process.cwd();
	const log = logger();

	const dryRun = Boolean( options.dryRun );
	const releaseBranch = options.releaseBranch || 'master';
	const npmTag = options.npmTag || 'latest';
	const customReleases = Array.isArray( options.customReleases ) ? options.customReleases : [ options.customReleases ].filter( Boolean );

	// When preparing packages for release, we check whether there are files in the directory structure of the package, which are
	// defined in the `#files` key in the `package.json`. It suffices that at least one file exists for each entry from the `#files`
	// key. Some files and directories, although defined in `#files`, are optional, so their absence in the package directory
	// should not be treated as an error. The list below defines this optional files and directories in the package.
	const optionalFilesAndDirectories = options.optionalFilesAndDirectories || null;

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
		.then( () => confirmNpmTag() )
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

	// Verifies if the provided by the user npm tag should be used to release new packages to npm.
	//
	// @returns {Promise}
	function confirmNpmTag() {
		if ( !releaseOptions.npm ) {
			return Promise.resolve();
		}

		const packageJson = getPackageJson( options.cwd );
		logProcess( 'Verifying the npm tag...' );

		const versionTag = getVersionTag( packageJson.version );

		if ( versionTag !== npmTag ) {
			log.warning( '⚠️  The version tag is different from the npm tag.' );
		} else {
			log.info( '✅  Release tags are defined correctly.' );
		}

		return cli.confirmNpmTag( versionTag, npmTag )
			.then( isConfirmed => {
				if ( !isConfirmed ) {
					throw new Error( BREAK_RELEASE_MESSAGE );
				}
			} );
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

			const matchedFiles = getMatchedFilesToPublish( packageJson, repositoryPath );
			const hasAllFilesToPublish = hasAllRequiredFilesToPublish( packageJson, matchedFiles );

			if ( dryRun || !hasAllFilesToPublish ) {
				showMatchedFiles( packageJson, matchedFiles );
			}

			let promise;

			if ( dryRun ) {
				promise = Promise.resolve( true );
			} else if ( hasAllFilesToPublish ) {
				promise = Promise.resolve( true );
			} else {
				promise = cli.confirmIncludingPackage();
			}

			return promise.then( shouldIncludePackage => {
				if ( !shouldIncludePackage ) {
					throw new Error( MISSING_FILES_MESSAGE );
				}

				const npmVersion = getVersionFromNpm( packageJson.name, npmTag );

				logDryRun( `Versions: package.json: "${ releaseDetails.version }", npm: "${ npmVersion || 'initial release' }".` );

				releaseDetails.npmVersion = npmVersion;
				releaseDetails.shouldReleaseOnNpm = npmVersion !== releaseDetails.version;

				if ( releaseDetails.shouldReleaseOnNpm ) {
					log.info( '✅  Added to release.' );

					releasesOnNpm.add( repositoryPath );
				} else {
					log.info( '❌  Nothing to release.' );
				}
			} );
		} );

		// Scans the patterns provided in the `#files` key from `package.json` and collects number of matched files for each entry.
		// The keys in returned map are file patterns, and their values represent number of matched files. If there is no `#files` key
		// in `package.json`, then empty map is returned.
		function getMatchedFilesToPublish( packageJson, repositoryPath ) {
			// TODO: Include the `main` and `types` properties if they are specified.
			if ( !packageJson.files ) {
				return new Map();
			}

			return packageJson.files.reduce( ( result, entry ) => {
				const globOptions = {
					cwd: repositoryPath,
					dot: true,
					nodir: true
				};

				// An entry in the `#files` key can point either to a file, or to a directory. To test both cases in one `glob` call,
				// we use a braced section in the `glob` syntax. A braced section starts with { and ends with } and they are expanded
				// into a set of patterns. A braced section may contain any number of comma-delimited sections (path fragments) within.
				//
				// Example: for entry 'src', the following braced section would expand into 'src' and 'src/**' patterns, both evaluated in
				// one `glob` call.
				const numberOfMatches = glob.sync( entry + '{,/**}', globOptions ).length;

				return result.set( entry, numberOfMatches );
			}, new Map() );
		}

		// Checks whether all the required files exist in the package directory. Returns `true` if all required files exist
		// and `false` otherwise. It takes into account optional files and directories.
		function hasAllRequiredFilesToPublish( packageJson, matchedFiles ) {
			// If no `#files` key exist in the `package.json`, assume that the package directory structure is valid.
			if ( !packageJson.files ) {
				return true;
			}

			// Otherwise, check if every entry in the `#files` key matches at least one file.
			for ( const [ entry, numberOfMatches ] of matchedFiles ) {
				// Some files and directories are optional, so their absence in the package directory structure should not be an error.
				if ( isEntryOptional( packageJson.name, entry ) ) {
					continue;
				}

				if ( numberOfMatches === 0 ) {
					return false;
				}
			}

			return true;
		}

		// Displays all entries from the `#files` key from `package.json` with number of matched files.
		function showMatchedFiles( packageJson, matchedFiles ) {
			if ( !packageJson.files ) {
				log.info( 'ℹ️  ' + chalk.yellow(
					'No `#files` key in package.json. The package directory has not been checked for the required files for release.'
				) );

				return;
			}

			const rows = [ ...matchedFiles ].map( row => {
				const [ entry, numberOfMatches ] = row;
				const isRequired = !isEntryOptional( packageJson.name, entry );
				const color = isRequired && numberOfMatches === 0 ? chalk.red.bold : chalk.white;

				return [
					color( entry ),
					color( numberOfMatches ),
					color( isRequired ? 'Yes' : 'No' )
				];
			} );

			const table = new Table( {
				head: [ 'Files pattern', 'Number of matches', 'Is required?' ],
				rows,
				style: {
					compact: true,
					head: [ 'white' ]
				}
			} );

			log.info( table.toString() );
		}

		// Checks whether the entry from the `#files` key is defined as optional for the package.
		function isEntryOptional( packageName, entry ) {
			if ( !optionalFilesAndDirectories ) {
				return false;
			}

			if ( optionalFilesAndDirectories[ packageName ] ) {
				return optionalFilesAndDirectories[ packageName ].includes( entry );
			}

			return optionalFilesAndDirectories.default.includes( entry );
		}

		// Checks whether specified `packageName` has been published on npm.
		// If so, returns its version. Otherwise returns `null` which means that
		// this package will be published for the first time.
		function getVersionFromNpm( packageName, npmTag ) {
			try {
				return exec( `npm show ${ packageName }@${ npmTag } version` ).trim();
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

			const packageJsonPath = path.join( repositoryPath, 'package.json' );
			const packageJson = getPackageJson( repositoryPath );

			log.info( `\nPublishing "${ chalk.underline( packageJson.name ) }" as "v${ packageJson.version }"...` );
			logDryRun( 'Do not panic. DRY RUN mode is active. An archive with the release will be created instead.' );

			const repositoryRealPath = customReleasesOnNpm.get( repositoryPath ) || repositoryPath;

			// If a package is written in TypeScript, the `main` field in the `package.json` file contains the path to the `index.ts` file.
			// However, on npm we want this field to point to the `index.js` file instead, because we publish only JavaScript files on npm.
			// For this reason we have to temporarily replace the extension in the `main` field while the package is being published to npm.
			// This change is then reverted.
			const hasTypeScriptEntryPoint = packageJson.main && packageJson.main.endsWith( '.ts' );
			const hasTypesProperty = !!packageJson.types;

			// TODO: The entire update phase should be done before collecting packages
			// TODO: to publish on npm (the `filterPackagesToReleaseOnNpm()` task).
			if ( hasTypeScriptEntryPoint ) {
				tools.updateJSONFile( packageJsonPath, jsonFile => {
					const { main } = jsonFile;

					jsonFile.main = main.replace( /\.ts$/, '.js' );

					if ( !hasTypesProperty ) {
						const typesPath = main.replace( /\.ts$/, '.d.ts' );
						const absoluteTypesPath = path.join( repositoryPath, typesPath );

						if ( fs.existsSync( absoluteTypesPath ) ) {
							jsonFile.types = typesPath;
						} else {
							log.warning( `⚠️  The "${ typesPath }" file does not exist and cannot be a source of typings.` );
						}
					}

					return jsonFile;
				} );
			}

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
				exec( `npm publish --access=public --tag ${ npmTag }` );
			}

			// Revert the previous temporary change in the `main` field, if a package is written in TypeScript, so its `main` field points
			// again to the `index.ts` file.
			if ( hasTypeScriptEntryPoint ) {
				tools.updateJSONFile( packageJsonPath, jsonFile => {
					jsonFile.main = jsonFile.main.replace( /\.js$/, '.ts' );

					if ( !hasTypesProperty ) {
						delete jsonFile.types;
					}

					return jsonFile;
				} );
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

		const versionTag = getVersionTag( releaseDetails.version );

		const githubReleaseOptions = {
			repositoryOwner: releaseDetails.repositoryOwner,
			repositoryName: releaseDetails.repositoryName,
			version: `v${ releaseDetails.version }`,
			description: releaseDetails.changes,
			isPrerelease: versionTag !== 'latest'
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

	/**
	 * Returns the version tag for the package.
	 *
	 * For the official release, returns the "latest" tag. For a non-official release (pre-release), returns the version tag extracted from
	 * the package version.
	 *
	 * @param {String} version Version of the package to be released.
	 * @returns {String}
	 */
	function getVersionTag( version ) {
		const [ versionTag ] = semver.prerelease( version ) || [ 'latest' ];

		return versionTag;
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
