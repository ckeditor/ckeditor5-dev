/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/**
 * Returns a promise that resolves to GitHub name of a developer who approved the `jobName` job.
 *
 * @param {String} circleCiToken
 * @param {String} workflowId
 * @param {String} jobName
 * @returns {Promise.<String>}
 */
module.exports = async function getJobApprover( circleCiToken, workflowId, jobName ) {
	const circleRequestOptions = {
		method: 'get',
		headers: {
			'Content-Type': 'application/json',
			'Accept': 'application/json',
			'Circle-Token': circleCiToken
		}
	};

	// Find an identifier of a developer who approved an approval job.
	const workflowJobsUrl = `https://circleci.com/api/v2/workflow/${ workflowId }/job`;
	const workflowJobs = await fetch( workflowJobsUrl, circleRequestOptions ).then( r => r.json() );
	const { approved_by: approvedBy } = workflowJobs.items.find( job => job.name === jobName );

	// Find a username based on the identifier.
	const userDetailsUrl = `https://circleci.com/api/v2/user/${ approvedBy }`;
	const { login } = await fetch( userDetailsUrl, circleRequestOptions ).then( r => r.json() );

	return login;
};
