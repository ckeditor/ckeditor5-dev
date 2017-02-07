/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const parseGithubUrl = require( 'parse-github-url' );
const { tools, logger } = require( '@ckeditor/ckeditor5-dev-utils' );
const generateChangelog = require( './generatechangelog' );
const createGithubRelease = require( './creategithubrelease' );
const updateDependenciesVersions = require( '../utils/updatedependenciesversions' );
const utils = require( '../utils/changelog' );
const versionUtils = require( '../utils/versions' );

/**
 * Creates a new release.
 *
 * Commits a new changelog (and package.json), creates a tag,
 * pushes the tag to a remote server and creates a note on GitHub releases page.
 *
 * @params {Options} options
 * @returns {Promise}
 */
module.exports = function createRelease( options ) {
	const cwd = process.cwd();
	const log = logger();
	const shExecParams = { verbosity: 'error' };

	const packageJsonPath = path.join( cwd, 'package.json' );
	const packageJson = require( packageJsonPath );

	log.info( `Generating changelog for "${ packageJson.name }".` );

	// Update dependencies/devDependencies versions in package.json.
	if ( options.dependencies.has( packageJson.name ) ) {
		updateDependenciesVersions( options.dependencies, packageJsonPath );

		// Commit the changes.
		tools.shExec( 'git add package.json', shExecParams );
		tools.shExec( 'git commit -m "Internal: Update dependencies."', shExecParams );

		const packageDetails = options.dependencies.get( packageJson.name );

		// If package does not have generated changelog - let's generate it.
		if ( !packageDetails.hasChangelog ) {
			return generateChangelog( packageDetails.version )
				.then( () => {
					packageDetails.hasChangelog = true;

					options.dependencies.set( packageJson.name, packageDetails );

					return createRelease( {
						token: options.token,
						skipGithub: options.skipGithub,
						skipNpm: options.skipNpm,
						dependencies: new Map()
					} );
				} );
		}
	}

	// Get last version from the changelog.
	const version = versionUtils.getLastFromChangelog();

	const promise = new Promise( ( resolve, reject ) => {
		const latestChanges = utils.getChangesForVersion( version );

		// Bump version in `package.json`.
		tools.updateJSONFile( packageJsonPath, ( json ) => {
			json.version = version;

			return json;
		} );

		log.info( `Committing "package.json"...` );
		tools.shExec( 'git add package.json', shExecParams );
		tools.shExec( `git commit --message="Release: v${ version }."`, shExecParams );

		log.info( 'Creating tag...' );
		tools.shExec( `git tag v${ version }`, shExecParams );
		tools.shExec( `git push origin master v${ version }`, shExecParams );

		if ( !options.skipNpm ) {
			log.info( 'Publishing on NPM...' );
			tools.shExec( 'npm publish', shExecParams );
		}

		if ( !options.skipGithub ) {
			log.info( 'Creating GitHub release...' );

			const repositoryInfo = parseGithubUrl(
				tools.shExec( 'git remote get-url origin --push', shExecParams ).trim()
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
		log.info( `Release "${ version }" has been created and published.` );
	} );
};
