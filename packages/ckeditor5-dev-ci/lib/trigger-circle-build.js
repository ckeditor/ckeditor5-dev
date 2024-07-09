/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-env node */

/**
 * @param options
 * @param {String} options.circleToken
 * @param {String} options.commit
 * @param {String} options.branch
 * @param {String} options.releaseBranch Define a branch that leads the release process.
 * @param {String} options.repositorySlug A repository slug (org/name) where a new build will be started.
 * @param {String|null} [options.triggerRepositorySlug=null] A repository slug (org/name) that triggers a new build.
 * @return {Promise}
 */
module.exports = async function triggerCircleBuild( options ) {
	const {
		circleToken,
		commit,
		branch,
		releaseBranch,
		repositorySlug,
		triggerRepositorySlug = null
	} = options;

	const requestUrl = `https://circleci.com/api/v2/project/github/${ repositorySlug }/pipeline`;

	const parameters = {
		triggerCommitHash: commit,
		isRelease: branch === releaseBranch
	};

	if ( triggerRepositorySlug ) {
		parameters.triggerRepositorySlug = triggerRepositorySlug;
	}

	const requestOptions = {
		method: 'post',
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
		} );
};
