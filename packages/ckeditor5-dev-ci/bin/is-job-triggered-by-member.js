#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const isJobTriggeredByMember = require( '../lib/is-job-triggered-by-member' );

const {
	CIRCLE_WORKFLOW_ID,
	CKE5_CIRCLE_TOKEN,
	CKE5_CIRCLE_APPROVAL_JOB_NAME,
	CKE5_GITHUB_TOKEN,
	CKE5_GITHUB_TEAM_SLUG,
	CKE5_GITHUB_ORGANIZATION
} = process.env;

const options = {
	circleToken: CKE5_CIRCLE_TOKEN,
	circleWorkflowId: CIRCLE_WORKFLOW_ID,
	circleApprovalJobName: CKE5_CIRCLE_APPROVAL_JOB_NAME,
	githubOrganization: CKE5_GITHUB_ORGANIZATION,
	githubTeamSlug: CKE5_GITHUB_TEAM_SLUG,
	githubToken: CKE5_GITHUB_TOKEN
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
