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
 * @param {string|null} [options.pipelineDefinitionId=null] A pipeline definition to trigger.
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
		pipelineDefinitionId = null,
		releaseBranch = null,
		triggerRepositorySlug = null
	} = options;

	// The new (GitHub App) endpoint accepts only the `gh` provider prefix, while the legacy one supports both.
	const requestUrl = pipelineDefinitionId ?
		`https://circleci.com/api/v2/project/gh/${ repositorySlug }/pipeline/run` :
		`https://circleci.com/api/v2/project/github/${ repositorySlug }/pipeline`;

	const parameters = {
		triggerCommitHash: commit
	};

	if ( releaseBranch ) {
		parameters.isRelease = branch === releaseBranch;
	}

	if ( triggerRepositorySlug ) {
		parameters.triggerRepositorySlug = triggerRepositorySlug;
	}

	const requestBody = pipelineDefinitionId ? {
		definition_id: pipelineDefinitionId,
		config: { branch },
		checkout: { branch },
		parameters
	} : { branch, parameters };

	const requestOptions = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Accept': 'application/json',
			'Circle-Token': circleToken
		},
		body: JSON.stringify( requestBody )
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
