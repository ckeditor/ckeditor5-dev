/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chalk = require( 'chalk' );
const parseGithubUrl = require( 'parse-github-url' );
const { tools, logger } = require( '@ckeditor/ckeditor5-dev-utils' );
const createGithubRelease = require( './creategithubrelease' );
const getPackageJson = require( './getpackagejson' );

/**
 * Releases the package defined in the current repository.
 *
 * This task bumps a version in package.json file and publish the changes on npm and/or GitHub.
 *
 * @param {Object} options
 * @param {String} options.token GitHub token used to authenticate.
 * @param {Boolean} options.skipGithub Whether to publish the package on Github.
 * @param {Boolean} options.skipNpm Whether to publish the package on Npm.
 * @param {String} options.version Version of the current release.
 * @param {String} options.changes Changelog entries for the current release.
 * @returns {Promise}
 */
module.exports = function releaseRepository( options ) {
	const cwd = process.cwd();
	const log = logger();

	const packageJson = getPackageJson( cwd );

	log.info( '' );
	log.info( chalk.bold.blue( `Publishing the release of "${ packageJson.name }".` ) );

	const promise = new Promise( ( resolve, reject ) => {
		// Bump the version.
		exec( `npm version ${ options.version } --message "Release: v${ options.version }."` );
		exec( `git push origin master v${ options.version }` );

		if ( !options.skipNpm ) {
			log.info( 'Publishing on NPM...' );
			exec( 'npm publish --access=public' );
		}

		if ( !options.skipGithub ) {
			log.info( 'Creating a GitHub release...' );

			const repositoryInfo = parseGithubUrl(
				exec( 'git remote get-url origin --push' ).trim()
			);

			const releaseOptions = {
				repositoryOwner: repositoryInfo.owner,
				repositoryName: repositoryInfo.name,
				version: `v${ options.version }`,
				description: options.changes
			};

			return createGithubRelease( options.token, releaseOptions )
				.then( () => {
					const url = `https://github.com/${ repositoryInfo.owner }/${ repositoryInfo.name }/releases/tag/v${ options.version }`;
					log.info( `Created the release: ${ url }` );

					resolve( options.version );
				} )
				.catch( reject );
		}

		resolve( options.version );
	} );

	return promise
		.then( version => {
			log.info( chalk.green( `Release "v${ version }" has been created and published.\n` ) );
		} );
};

function exec( command ) {
	return tools.shExec( command, { verbosity: 'error' } );
}
