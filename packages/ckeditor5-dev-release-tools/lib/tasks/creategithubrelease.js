/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { Octokit } = require( '@octokit/rest' );

/**
 * Create a Github release.
 *
 * @param {Object} options
 * @param {String} options.token Token used to authenticate with GitHub.
 * @param {String} options.version Name of tag connected with the release.
 * @param {String} options.repositoryOwner Owner of the repository.
 * @param {String} options.repositoryName Repository name.
 * @param {String} options.description Description of the release.
 * @returns {Promise.<String>}
 */
module.exports = function createGithubRelease( options ) {
	const {
		token,
		version,
		repositoryOwner,
		repositoryName,
		description
	} = options;

	const isPrerelease = false; // TODO: Detect it from a version.

	const github = new Octokit( {
		version: '3.0.0',
		auth: `token ${ token }`
	} );

	const releaseParams = {
		tag_name: `v${ version }`,
		owner: repositoryOwner,
		repo: repositoryName,
		body: description,
		prerelease: isPrerelease
	};

	// TODO: Tests.

	return github.repos.createRelease( releaseParams )
		.then( () => {
			return `https://github.com/${ repositoryOwner }/${ repositoryName }/releases/tag/v${ version }`;
		} );
};
