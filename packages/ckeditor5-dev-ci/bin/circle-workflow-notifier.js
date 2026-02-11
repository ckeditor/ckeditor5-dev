#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { parseArgs } from 'node:util';
import { execSync } from 'node:child_process';
import processJobStatuses from '../lib/process-job-statuses.js';
import isWorkflowFinished from '../lib/utils/is-workflow-finished.js';
import getOtherWorkflowJobs from '../lib/utils/get-other-workflow-jobs.js';

// This script allows the creation of a new job within a workflow that will be executed
// in the end, when all other jobs will be finished or errored.
//
// Below, you can find an example workflow.
//
//   ┌─────┐     ┌─────┐
//   │Job A├────►│Job B├──────────┐
//   └─────┘     └─────┘          ▼
//                           ┌────────┐
//                           │Notifier│
//                           └────────┘
//   ┌─────┐                      ▲
//   │Job C├──────────────────────┘
//   └─────┘
//
// Job A triggers Job B, and Job C has no dependencies. When all jobs are done, we would like to execute Notifier.
//
// The notifier job should also be executed when Job A ends with an error. In such a case, Job B is still blocked.
// Hence, we need to iterate over all jobs and verify if their dependencies ended with an error to unlock
// executing the final part of the workflow.
//
// When using an approval-based job, the notifier will be waiting for all jobs by default. Finally, it leads to the timeout error.
// See: https://github.com/ckeditor/ckeditor5/issues/16403.
//
// By defining the `--ignore` option, you can skip waiting for particular jobs.
// You can also specify jobs to ignore.
//
// Let's consider the example below:
//   ┌─────┐     ┌─────┐
//   │Job A├────►│Job B├──────────┐
//   └─────┘     └─────┘          ▼
//                           ┌────────┐
//                           │Notifier│
//                           └────────┘
//   ┌─────┐                      ▲
//   │Job C├──────────────────────┘
//   └─────┘                      |
//   ┌─────┐     ┌─────┐          |
//   │Job D├────►│Job E├──────────┘
//   └─────┘     └─────┘
//
// The assumption is that "Job D" is the approval job. To ignore it and its children, you can execute
// the notifier like this:
//
// $ ckeditor5-dev-ci-circle-workflow-notifier --ignore="Job D" --ignore="Job E"

const {
	/**
	 * Required. CircleCI API token used for obtaining data about the build from API.
	 */
	CKE5_CIRCLE_TOKEN,

	// Variables that are available by default in Circle environment.
	CIRCLE_WORKFLOW_ID,
	CIRCLE_JOB
} = process.env;

const { values: { task, ignore } } = parseArgs( {
	options: {
		task: {
			type: 'string',
			default: 'pnpm ckeditor5-dev-ci-notify-circle-status'
		},
		ignore: {
			type: 'string',
			multiple: true,
			default: []
		}
	}
} );

const CIRCLE_API_MAX_ATTEMPTS = 5;
const CIRCLE_API_RETRY_DELAY_MS = 10 * 1000;

waitForOtherJobsAndSendNotification()
	.catch( err => {
		console.error( err );

		process.exit( 1 );
	} );

async function waitForOtherJobsAndSendNotification() {
	assertRequiredEnvironmentVariables();

	const allJobs = await getOtherWorkflowJobs( {
		circleToken: CKE5_CIRCLE_TOKEN,
		workflowId: CIRCLE_WORKFLOW_ID,
		currentJobName: CIRCLE_JOB,
		maxAttempts: CIRCLE_API_MAX_ATTEMPTS,
		retryDelayMs: CIRCLE_API_RETRY_DELAY_MS
	} );

	const jobs = processJobStatuses( allJobs )
		.filter( job => !ignore.includes( job.name ) );

	if ( !isWorkflowFinished( jobs ) ) {
		await new Promise( r => setTimeout( r, 30 * 1000 ) );

		return waitForOtherJobsAndSendNotification();
	}

	// If any ignored job failed, all of its children will be marked as 'failed_parent', and thus will not trigger this check.
	const anyJobsFailed = jobs.some( job => job.status === 'failed' );

	if ( anyJobsFailed ) {
		return execSync( task, { stdio: 'inherit' } );
	}

	console.log( 'All jobs were successful.' );
}

function assertRequiredEnvironmentVariables() {
	if ( !CKE5_CIRCLE_TOKEN ) {
		throw new Error( 'Missing environment variable: CKE5_CIRCLE_TOKEN' );
	}

	if ( !CIRCLE_WORKFLOW_ID ) {
		throw new Error( 'Missing environment variable: CIRCLE_WORKFLOW_ID' );
	}

	if ( !CIRCLE_JOB ) {
		throw new Error( 'Missing environment variable: CIRCLE_JOB' );
	}
}
