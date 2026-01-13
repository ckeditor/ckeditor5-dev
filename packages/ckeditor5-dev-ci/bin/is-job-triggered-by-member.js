#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { parseArgs } from 'node:util';
import isJobTriggeredByMember from '../lib/is-job-triggered-by-member.js';

/**
 * This script checks if a user that approved an approval job could do that.
 *
 * In order to integrate the action in your pipeline, you need prepare a few CLI or environment variables:
 *
 *   - `CIRCLE_WORKFLOW_ID` - provided by default by CircleCI and keeps a unique id of the CI build.
 *   - `CKE5_CIRCLE_TOKEN` - an authorization token to talk to CircleCI REST API.
 *   - `CKE5_GITHUB_TOKEN` - a GitHub token used for authorization a request.
 *   - `--team` - a GitHub team name (slug) that defines accounts that could approve the job.
 *   - `--organization` - your GitHub organization.
 *  - `--job` - a job name to verify.
 *
 * Example usage:
 * CKE5_CIRCLE_TOKEN=... ckeditor5-dev-ci-is-job-triggered-by-member
 */

const { values: cliOptions } = parseArgs( {
	options: {
		job: {
			type: 'string',
			default: process.env.CKE5_CIRCLE_APPROVAL_JOB_NAME
		},
		organization: {
			type: 'string',
			default: process.env.CKE5_GITHUB_ORGANIZATION
		},
		team: {
			type: 'string',
			default: process.env.CKE5_GITHUB_TEAM_SLUG
		}
	}
} );

const options = {
	circleToken: process.env.CKE5_CIRCLE_TOKEN,
	circleWorkflowId: process.env.CIRCLE_WORKFLOW_ID,
	circleApprovalJobName: cliOptions.job,
	githubOrganization: cliOptions.organization,
	githubTeamSlug: cliOptions.team,
	githubToken: process.env.CKE5_GITHUB_TOKEN
};

isJobTriggeredByMember( options )
	.then( result => {
		if ( !result ) {
			console.log( `This account cannot approve the "${ options.circleApprovalJobName }" job. Aborting.` );
			process.exit( 1 );
		}

		console.log( `The "${ options.circleApprovalJobName }" job was approved by a team member.` );
	} )
	.catch( err => {
		console.error( err );

		process.exit( 1 );
	} );
