/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-env node */

'use strict';

const fetch = require( 'node-fetch' );

/**
 * Returns a promise that resolves the commit details (author and message) based on the specified GitHub URL.
 *
 * @param {String} commitUrl The URL to the commit on GitHub.
 * @param {String} githubToken Github token used for authorization a request,
 * @returns {Promise.<Object>}
 */
module.exports = function getCommitDetails( commitUrl, githubToken ) {
	const apiGithubUrlCommit = getGithubApiUrl( commitUrl );
	const options = {
		method: 'GET',
		credentials: 'include',
		headers: {
			authorization: `token ${ githubToken }`
		}
	};

	return fetch( apiGithubUrlCommit, options )
		.then( response => response.json() )
		.then( json => ( {
			githubAccount: json.author ? json.author.login : null,
			commitAuthor: json.commit.author.name,
			commitMessage: json.commit.message
		} ) );
};

/**
 * Returns a URL to GitHub API which returns details of the commit that caused the CI to fail its job.
 *
 * @param {String} commitUrl The URL to the commit on GitHub.
 * @returns {String}
 */
function getGithubApiUrl( commitUrl ) {
	return commitUrl.replace( 'github.com/', 'api.github.com/repos/' ).replace( '/commit/', '/commits/' );
}
