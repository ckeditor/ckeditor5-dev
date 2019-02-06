/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const GitHubApi = require( '@octokit/rest' );

/**
 * Create a Github release.
 *
 * @param {String} token Token used to authenticate with GitHub.
 * @param {Object} options
 * @param {String} options.repositoryOwner Owner of the repository.
 * @param {String} options.repositoryName Repository name.
 * @param {String} options.version Name of tag connected with the release.
 * @param {String} options.description Description of the release.
 * @returns {Promise}
 */
module.exports = function createGithubRelease( token, options ) {
	const github = new GitHubApi( {
		version: '3.0.0'
	} );

	github.authenticate( {
		token,
		type: 'oauth',
	} );

	const releaseParams = {
		owner: options.repositoryOwner,
		repo: options.repositoryName,
		tag_name: options.version,
		body: options.description
	};

	return new Promise( ( resolve, reject ) => {
		github.repos.createRelease( releaseParams, ( err, responses ) => {
			if ( err ) {
				return reject( err );
			}

			resolve( responses );
		} );
	} );
};
