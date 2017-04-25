/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { logger } = require( '@ckeditor/ckeditor5-dev-utils' );
const executeOnDependencies = require( './release-tools/utils/executeondependencies' );
const getPackagesToRelease = require( './release-tools/utils/getpackagestorelease' );
const validator = require( './release-tools/utils/releasevalidator' );
const cli = require( './release-tools/utils/cli' );
const displaySkippedPackages = require( './release-tools/utils/displayskippedpackages' );

const BREAK_RELEASE_MESSAGE = 'Creating release has been aborted by the user.';

const tasks = {
	generateChangelog: require( './release-tools/tasks/generatechangelog' ),

	createRelease: require( './release-tools/tasks/createrelease' ),

	/**
	 * Generates the changelog for dependencies.
	 *
	 * @param {Object} options
	 * @param {String} options.cwd Current working directory (packages) from which all paths will be resolved.
	 * @param {String} options.packages Where to look for other packages (dependencies).
	 * @param {Array.<String>} options.skipPackages Name of packages which will be skipped.
	 * @param {Boolean} options.isDevPackage Whether the changelog will be generated for development packages.
	 * @param {Boolean} [options.checkPackageJson=true] If set to false, the mechanism will not check whether
	 * the current package being specified in 'package.json' file.
	 * @returns {Promise}
	 */
	generateChangelogForDependencies( options ) {
		const execOptions = {
			cwd: options.cwd,
			packages: options.packages,
			skipPackages: options.skipPackages || [],
			checkPackageJson: typeof options.checkPackageJson == 'undefined' ? true : options.checkPackageJson
		};

		const generatedChangelog = {};

		const generateChangelogForSinglePackage = ( repositoryName, repositoryPath ) => {
			process.chdir( repositoryPath );

			const changelogOptions = {
				isDevPackage: options.isDevPackage
			};

			return tasks.generateChangelog( null, changelogOptions )
				.then( ( newVersion ) => {
					if ( newVersion ) {
						generatedChangelog[ repositoryName ] = `v${ newVersion }`;
					}
				} );
		};

		return executeOnDependencies( execOptions, generateChangelogForSinglePackage )
			.then( ( skippedPackages ) => {
				displaySkippedPackages( skippedPackages );

				process.chdir( options.cwd );
			} )
			.then( () => {
				const packageNames = Object.keys( generatedChangelog );

				if ( !packageNames.length ) {
					return;
				}

				const log = logger();

				let message = 'Changelog for packages listed below has been generated:\n';
				message += packageNames.map( ( packageName ) => `  * ${ generatedChangelog[ packageName ] }` ).join( '\n' );

				log.info( message );
			} );
	},

	/**
	 * Task releases the dependencies. It collects packages that will be release,
	 * validates whether the packages can be released and gather required data from the user.
	 *
	 * @param {Object} options
	 * @param {String} options.cwd Current working directory (packages) from which all paths will be resolved.
	 * @param {String} options.packages Where to look for other packages (dependencies).
	 * @param {Array.<String>} options.skipPackages Name of packages which won't be released.
	 * @returns {Promise}
	 */
	releaseDependencies( options ) {
		const log = logger();

		const execOptions = {
			cwd: options.cwd,
			packages: options.packages,
			skipPackages: options.skipPackages || []
		};

		// Errors are added to this array by the `validatePackages` function.
		const errors = [];

		return getPackagesToRelease( execOptions )
			.then( ( dependencies ) => {
				options.dependencies = dependencies;

				if ( dependencies.size === 0 ) {
					throw new Error( 'None of the packages contains any changes since its last release. Aborting.' );
				}

				return cli.confirmRelease( dependencies );
			} )
			.then( ( isConfirmed ) => {
				if ( !isConfirmed ) {
					throw new Error( BREAK_RELEASE_MESSAGE );
				}

				return executeOnDependencies( execOptions, validatePackages );
			} )
			.then( () => {
				if ( errors.length ) {
					throw new Error( 'Releasing has been aborted due to errors.' );
				}

				return cli.configureReleaseOptions();
			} )
			.then( ( parsedOptions ) => {
				options.token = parsedOptions.token;
				options.skipGithub = parsedOptions.skipGithub;
				options.skipNpm = parsedOptions.skipNpm;

				return executeOnDependencies( execOptions, releaseSinglePackage );
			} )
			.then( () => process.chdir( options.cwd ) )
			.catch( ( err ) => {
				// A user did not confirm the release process.
				if ( err instanceof Error && err.message === BREAK_RELEASE_MESSAGE ) {
					return Promise.resolve();
				}

				log.error( err.message );
				errors.forEach( log.error.bind( log ) );

				process.exitCode = -1;
			} );

		function releaseSinglePackage( repositoryName, repositoryPath ) {
			if ( !options.dependencies.has( repositoryName ) ) {
				return Promise.resolve();
			}

			process.chdir( repositoryPath );

			return tasks.createRelease( {
				token: options.token,
				dependencies: options.dependencies,
				skipGithub: options.skipGithub,
				skipNpm: options.skipNpm
			} );
		}

		function validatePackages( repositoryName, repositoryPath ) {
			if ( !options.dependencies.has( repositoryName ) ) {
				return Promise.resolve();
			}

			process.chdir( repositoryPath );

			try {
				validator.checkBranch();
			} catch ( err ) {
				errors.push( `## ${ repositoryName }` );
				errors.push( err.message );
			}

			return Promise.resolve();
		}
	},

	/**
	 * Collects translation strings ( from `t()` calls ) and stores them in ckeditor5/build/.transifex directory.
	 */
	collectTranslations() {
		const collectTranslations = require( './translations/collect' );

		collectTranslations();
	},

	/**
	 * Uploads translation strings on the Transifex server.
	 *
	 * @returns {Promise}
	 */
	uploadTranslations() {
		const uploadTranslations = require( './translations/upload' );
		const getToken = require( './translations/gettoken' );

		return getToken()
			.then( credentials => uploadTranslations( credentials ) );
	},

	/**
	 * Download translations from the Transifex server.
	 *
	 * @returns {Promise}
	 */
	downloadTranslations() {
		const downloadTranslations = require( './translations/download' );
		const getToken = require( './translations/gettoken' );

		return getToken()
			.then( credentials => downloadTranslations( credentials ) );
	}
};

module.exports = tasks;
