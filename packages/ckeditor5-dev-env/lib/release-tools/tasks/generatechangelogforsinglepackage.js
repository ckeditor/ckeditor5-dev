/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chalk = require( 'chalk' );
const { tools, logger } = require( '@ckeditor/ckeditor5-dev-utils' );
const cli = require( '../utils/cli' );
const versionUtils = require( '../utils/versions' );
const changelogUtils = require( '../utils/changelog' );
const getPackageJson = require( '../utils/getpackagejson' );
const getNewReleaseType = require( '../utils/getnewreleasetype' );
const generateChangelogFromCommits = require( '../utils/generatechangelogfromcommits' );
const transformCommitFunction = require( '../utils/transform-commit/transformcommitforsubrepository' );

/**
 * Generates the release changelog based on commit messages in the repository.
 *
 * User can provide a version for the entry in changelog.
 *
 * If package does not have any commits, user has to confirm whether the changelog
 * should be generated.
 *
 * @param {String|null} [newVersion=null] A version for which changelog will be generated.
 * @returns {Promise}
 */
module.exports = function generateChangelogForSinglePackage( newVersion = null ) {
	const log = logger();
	const packageJson = getPackageJson();

	let tagName = versionUtils.getLastFromChangelog();

	if ( tagName ) {
		tagName = 'v' + tagName;
	}

	log.info( '' );
	log.info( chalk.bold.blue( `Generating changelog for "${ packageJson.name }"...` ) );

	let promise = Promise.resolve();

	if ( !newVersion ) {
		promise = promise
			.then( () => {
				return getNewReleaseType( transformCommitFunction, { tagName } );
			} )
			.then( response => {
				const newReleaseType = response.releaseType !== 'skip' ? response.releaseType : null;

				return cli.provideVersion( packageJson.version, newReleaseType );
			} );
	} else {
		promise = promise.then( () => newVersion );
	}

	return promise
		.then( version => {
			if ( version === 'skip' ) {
				return Promise.resolve();
			}

			const changelogOptions = {
				version,
				tagName,
				newTagName: 'v' + version,
				transformCommit: transformCommitFunction
			};

			return generateChangelogFromCommits( changelogOptions )
				.then( () => {
					tools.shExec( `git add ${ changelogUtils.changelogFile }`, { verbosity: 'error' } );
					tools.shExec( 'git commit -m "Docs: Changelog. [skip ci]"', { verbosity: 'error' } );

					log.info(
						chalk.green( `Changelog for "${ packageJson.name }" (v${ version }) has been generated.` )
					);

					return Promise.resolve( version );
				} );
		} );
};
