/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @param options
 * @param {string} options.circleToken
 * @param {string} options.commit
 * @param {string} options.branch
 * @param {string} options.repositorySlug A repository slug (org/name) where a new build will be started.
 * @param {string|null} [options.releaseBranch=null] Define a branch that leads the release process.
 * @param {string|null} [options.triggerRepositorySlug=null] A repository slug (org/name) that triggers a new build.
 * @returns {Promise}
 */
export default async function triggerCircleBuild( options ) {
	const {
		circleToken,
		commit,
		branch,
		repositorySlug,
		releaseBranch = null,
		triggerRepositorySlug = null
	} = options;

	const requestUrl = `https://circleci.com/api/v2/project/github/${ repositorySlug }/pipeline`;

	const parameters = {
		triggerCommitHash: commit
	};

	if ( releaseBranch ) {
		parameters.isRelease = branch === releaseBranch;
	}

	if ( triggerRepositorySlug ) {
		parameters.triggerRepositorySlug = triggerRepositorySlug;
	}

	const requestOptions = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Accept': 'application/json',
			'Circle-Token': circleToken
		},
		body: JSON.stringify( { branch, parameters } )
	};

	return fetch( requestUrl, requestOptions )
		.then( res => res.json() )
		.then( response => {
			if ( response.error_message ) {
				throw new Error( `CI trigger failed: "${ response.error_message }".` );
			}

			if ( response.message ) {
				throw new Error( `CI trigger failed: "${ response.message }".` );
			}
		} );
}
