/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { Octokit } from '@octokit/rest';
import getJobApprover from './utils/get-job-approver.js';

/**
 * @param options
 * @param {string} options.circleToken
 * @param {string} options.circleWorkflowId
 * @param {string} options.circleApprovalJobName
 * @param {string} options.githubOrganization
 * @param {string} options.githubTeamSlug
 * @param {string} options.githubToken
 * @returns {Promise.<boolean>}
 */
export default async function isJobTriggeredByMember( options ) {
	const {
		circleToken,
		circleWorkflowId,
		circleApprovalJobName,
		githubOrganization,
		githubTeamSlug,
		githubToken
	} = options;

	const login = await getJobApprover( circleToken, circleWorkflowId, circleApprovalJobName );
	const octokit = new Octokit( { auth: githubToken } );
	const { data } = await octokit.request( 'GET /orgs/{org}/teams/{team_slug}/members', {
		org: githubOrganization,
		team_slug: githubTeamSlug,
		headers: {
			'X-GitHub-Api-Version': '2022-11-28'
		}
	} );

	return data
		.map( ( { login } ) => login )
		.includes( login );
}
