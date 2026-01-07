/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { workspaces } from '@ckeditor/ckeditor5-dev-utils';
import { Octokit } from '@octokit/rest';
import getNpmTagFromVersion from '../utils/getnpmtagfromversion.js';

/**
 * Create a GitHub release.
 *
 * @param {object} options
 * @param {string} options.token Token used to authenticate with GitHub.
 * @param {string} options.version Name of tag connected with the release.
 * @param {string} options.description Description of the release.
 * @param {string} [options.cwd=process.cwd()] Current working directory from which all paths will be resolved.
 * @returns {Promise.<string>}
 */
export default async function createGithubRelease( options ) {
	const {
		token,
		version,
		description,
		cwd = process.cwd()
	} = options;

	const github = new Octokit( {
		version: '3.0.0',
		auth: `token ${ token }`
	} );

	const repositoryUrl = workspaces.getRepositoryUrl( cwd );
	const [ repositoryName, repositoryOwner ] = repositoryUrl.split( '/' ).reverse();

	if ( await shouldCreateRelease( github, repositoryOwner, repositoryName, version ) ) {
		await github.repos.createRelease( {
			tag_name: `v${ version }`,
			owner: repositoryOwner,
			repo: repositoryName,
			body: description,
			prerelease: getNpmTagFromVersion( version ) !== 'latest'
		} );
	}

	return `https://github.com/${ repositoryOwner }/${ repositoryName }/releases/tag/v${ version }`;
}

/**
 * Resolves a promise containing a flag if the GitHub contains the release page for given version.
 *
 * @param {Octokit} github
 * @param {string} repositoryOwner
 * @param {string} repositoryName
 * @param {string} version
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
