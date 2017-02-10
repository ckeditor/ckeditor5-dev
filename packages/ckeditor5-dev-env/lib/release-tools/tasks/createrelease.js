/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const chalk = require( 'chalk' );
const parseGithubUrl = require( 'parse-github-url' );
const { tools, logger } = require( '@ckeditor/ckeditor5-dev-utils' );
const generateChangelog = require( './generatechangelog' );
const createGithubRelease = require( './creategithubrelease' );
const updateDependenciesVersions = require( '../utils/updatedependenciesversions' );
const changelogUtils = require( '../utils/changelog' );
const versionUtils = require( '../utils/versions' );
const getPackageJson = require( '../utils/getpackagejson' );

/**
 * Creates a new release.
 *
 * Commits a new changelog (and package.json), creates a tag,
 * pushes the tag to a remote server and creates a note on GitHub releases page.
 *
 * @param {Object} options
 * @param {String} options.token GitHub token used to authenticate.
 * @param {Boolean} options.skipGithub Whether to publish the package on Github.
 * @param {Boolean} options.skipNpm Whether to publish the package on Npm.
 * @param {String} options.cwd Current working directory (packages) from which all paths will be resolved.
 * @param {String} options.packages Where to look for other packages (dependencies).
 * @param {Map} options.dependencies Dependencies list to update.
 * @returns {Promise}
 */
module.exports = function createRelease( options ) {
	const cwd = process.cwd();
	const log = logger();

	const packageJsonPath = path.join( cwd, 'package.json' );
	const packageJson = getPackageJson( cwd );

	log.info( `Creating release for "${ packageJson.name }".` );

	if ( options.dependencies ) {
		// Update dependencies/devDependencies versions in package.json.
		updateDependenciesVersions( options.dependencies, packageJsonPath );

		if ( exec( 'git diff --name-only package.json' ).trim().length ) {
			log.info( 'Updating dependencies...' );
			exec( 'git add package.json' );
			exec( 'git commit -m "Internal: Updated dependencies."' );
		}

		const packageDetails = options.dependencies.get( packageJson.name );

		// If package does not have generated changelog - let's generate it.
		if ( packageDetails && !packageDetails.hasChangelog ) {
			return generateChangelog( packageDetails.version )
				.then( () => {
					packageDetails.hasChangelog = true;

					options.dependencies.set( packageJson.name, packageDetails );

					return createRelease( {
						token: options.token,
						skipGithub: options.skipGithub,
						skipNpm: options.skipNpm,
						dependencies: null
					} );
				} );
		}
	}

	// Get last version from the changelog.
	const version = versionUtils.getLastFromChangelog();

	const promise = new Promise( ( resolve, reject ) => {
		const latestChanges = changelogUtils.getChangesForVersion( version );

		// Bump version in `package.json`.
		tools.updateJSONFile( packageJsonPath, ( json ) => {
			json.version = version;

			return json;
		} );

		log.info( `Committing "package.json"...` );
		exec( 'git add package.json' );
		exec( `git commit --message="Release: v${ version }."` );

		log.info( 'Creating a tag...' );
		exec( `git tag v${ version }` );
		exec( `git push origin master v${ version }` );

		if ( !options.skipNpm ) {
			log.info( 'Publishing on NPM...' );
			exec( 'npm publish' );
		}

		if ( !options.skipGithub ) {
			log.info( 'Creating a GitHub release...' );

			const repositoryInfo = parseGithubUrl(
				exec( 'git remote get-url origin --push' ).trim()
			);

			const releaseOptions = {
				repositoryOwner: repositoryInfo.owner,
				repositoryName: repositoryInfo.name,
				version: `v${ version }`,
				description: latestChanges
			};

			return createGithubRelease( options.token, releaseOptions )
				.then( resolve )
				.catch( reject );
		}

		resolve();
	} );

	return promise.then( () => {
		log.info( chalk.green( `Release "v${ version }" has been created and published.\n` ) );
	} );
};

function exec( command ) {
	return tools.shExec( command, { verbosity: 'error' } );
}
