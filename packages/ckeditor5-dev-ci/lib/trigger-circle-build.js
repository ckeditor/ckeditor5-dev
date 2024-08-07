/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-env node */

const fetch = require( 'node-fetch' );

/**
 * @param options
 * @param {String} options.circleToken
 * @param {String} options.commit
 * @param {String} options.branch
 * @param {String} options.repositorySlug A repository slug (org/name) where a new build will be started.
 * @param {String|null} [options.releaseBranch=null] Define a branch that leads the release process.
 * @param {String|null} [options.triggerRepositorySlug=null] A repository slug (org/name) that triggers a new build.
 * @return {Promise}
 */
module.exports = async function triggerCircleBuild( options ) {
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

			if ( response.message ) {
				throw new Error( `CI trigger failed: "${ response.message }".` );
			}
		} );
};
