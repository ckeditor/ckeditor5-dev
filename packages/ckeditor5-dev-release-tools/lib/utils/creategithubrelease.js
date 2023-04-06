/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { Octokit } = require( '@octokit/rest' );

/**
 * Create a Github release.
 *
 * @param {String} token Token used to authenticate with GitHub.
 * @param {Object} options
 * @param {String} options.repositoryOwner Owner of the repository.
 * @param {String} options.repositoryName Repository name.
 * @param {String} options.version Name of tag connected with the release.
 * @param {String} options.description Description of the release.
 * @param {Boolean} options.isPrerelease Indicates whether the release is a pre-release.
 * @returns {Promise}
 */
module.exports = function createGithubRelease( token, options ) {
	const github = new Octokit( {
		version: '3.0.0',
		auth: `token ${ token }`
	} );

	const releaseParams = {
		owner: options.repositoryOwner,
		repo: options.repositoryName,
		tag_name: options.version,
		body: options.description,
		prerelease: options.isPrerelease
	};

	return github.repos.createRelease( releaseParams );
};
