/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { Octokit } = require( '@octokit/rest' );
const semver = require( 'semver' );

/**
 * Create a GitHub release.
 *
 * @param {Object} options
 * @param {String} options.token Token used to authenticate with GitHub.
 * @param {String} options.version Name of tag connected with the release.
 * @param {String} options.repositoryOwner Owner of the repository.
 * @param {String} options.repositoryName Repository name.
 * @param {String} options.description Description of the release.
 * @returns {Promise.<String>}
 */
module.exports = async function createGithubRelease( options ) {
	const {
		token,
		version,
		repositoryOwner,
		repositoryName,
		description
	} = options;

	const github = new Octokit( {
		version: '3.0.0',
		auth: `token ${ token }`
	} );

	if ( await shouldCreateRelease( github, repositoryOwner, repositoryName, version ) ) {
		await github.repos.createRelease( {
			tag_name: `v${ version }`,
			owner: repositoryOwner,
			repo: repositoryName,
			body: description,
			prerelease: getVersionTag( version ) !== 'latest'
		} );
	}

	return `https://github.com/${ repositoryOwner }/${ repositoryName }/releases/tag/v${ version }`;
};

/**
 * Returns an npm tag based on the specified release version.
 *
 * @param {String} version
 * @returns {String}
 */
function getVersionTag( version ) {
	const [ versionTag ] = semver.prerelease( version ) || [ 'latest' ];

	return versionTag;
}

/**
 * Resolves a promise containing a flag if the GitHub contains the release page for given version.
 *
 * @param {Octokit} github
 * @param {String} repositoryOwner
 * @param {String} repositoryName
 * @param {String} version
 * @returns {Promise.<boolean>}
 */
async function shouldCreateRelease( github, repositoryOwner, repositoryName, version ) {
	const releaseDetails = await getLastRelease( github, repositoryOwner, repositoryName );

	// It can be `null` if there is no releases on GitHub.
	let githubVersion = releaseDetails.data.tag_name;

	if ( githubVersion ) {
		githubVersion = releaseDetails.data.tag_name.replace( /^v/, '' );
	}

	// If versions are different, we are ready to create a new release.
	return githubVersion !== version;
}

function getLastRelease( github, repositoryOwner, repositoryName ) {
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
