/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { Octokit } from '@octokit/rest';
import { workspaces } from '@ckeditor/ckeditor5-dev-utils';

const VALIDATION_TAG_NAME = 'ckeditor5-dev-release-tools-token-validation';

/**
 * Verifies that a GitHub token can create a release in the current repository.
 *
 * @param {string} token Token used to authenticate with GitHub.
 * @param {object} [options]
 * @param {string} [options.cwd=process.cwd()] Current working directory from which the repository will be resolved.
 * @returns {Promise.<string>} The normalized token.
 */
export default async function validateGithubToken( token, { cwd = process.cwd() } = {} ) {
	const normalizedToken = token.trim();

	if ( !normalizedToken ) {
		throw new Error( 'The token cannot be empty.' );
	}

	const repositoryUrl = workspaces.getRepositoryUrl( cwd );
	const [ repositoryName, repositoryOwner ] = repositoryUrl.split( '/' ).reverse();
	const repository = `${ repositoryOwner }/${ repositoryName }`;
	const github = new Octokit( { auth: normalizedToken } );

	let repositoryDetails;

	try {
		repositoryDetails = await github.repos.get( {
			owner: repositoryOwner,
			repo: repositoryName
		} );
	} catch ( error ) {
		throw createValidationError( error, repository );
	}

	try {
		// This endpoint only computes and returns proposed release notes. It does not persist a release, tag, or any other data.
		// See: https://docs.github.com/en/rest/releases/releases#generate-release-notes-content-for-a-release
		await github.repos.generateReleaseNotes( {
			owner: repositoryOwner,
			repo: repositoryName,
			tag_name: VALIDATION_TAG_NAME,
			target_commitish: repositoryDetails.data.default_branch
		} );
	} catch ( error ) {
		throw createValidationError( error, repository );
	}

	return normalizedToken;
}

/**
 * @param {Error & { status?: number, response?: { data?: { message?: string } } }} error
 * @param {string} repository
 * @returns {Error}
 */
function createValidationError( error, repository ) {
	const githubMessage = error.response?.data?.message || error.message;

	if ( error.status ) {
		return new Error( `GitHub API request for the "${ repository }" repository failed ` +
			`with HTTP ${ error.status }: ${ githubMessage }` );
	}

	return new Error( `Could not verify the token for the "${ repository }" repository: ${ githubMessage }` );
}
