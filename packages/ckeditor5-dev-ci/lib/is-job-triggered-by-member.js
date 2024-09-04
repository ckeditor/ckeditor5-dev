/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { Octokit } from '@octokit/rest';
import getJobApprover from './utils/get-job-approver';

/**
 * @param options
 * @param {String} options.circleToken
 * @param {String} options.circleWorkflowId
 * @param {String} options.circleApprovalJobName
 * @param {String} options.githubOrganization
 * @param {String} options.githubTeamSlug
 * @param {String} options.githubToken
 * @return {Promise.<Boolean>}
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
