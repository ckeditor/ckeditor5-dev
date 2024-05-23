#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-env node */

'use strict';

const { execSync } = require( 'child_process' );
const fetch = require( 'node-fetch' );
const minimist = require( 'minimist' );
const processJobStatuses = require( '../lib/process-job-statuses' );

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
// You can also specify jobs to ignore
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
//   ┌─────┐     ┌─────┐
//   │Job D├────►│Job E├──────────┘
//   └─────┘     └─────┘
//
// The assumption is that "Job D" is the approval job. To ignore it and its children, you can execute
// the notifier like this:
//
// $ ckeditor5-dev-ci-circle-workflow-notifier --ignore "Job D" --ignore "Job E"

const {
	/**
	 * Required. CircleCI API token used for obtaining data about the build from API.
	 */
	CKE5_CIRCLE_TOKEN,

	// Variables that are available by default in Circle environment.
	CIRCLE_WORKFLOW_ID,
	CIRCLE_JOB
} = process.env;

const { task, ignore } = parseArguments( process.argv.slice( 2 ) );

waitForOtherJobsAndSendNotification()
	.catch( err => {
		console.error( err );

		process.exit( 1 );
	} );

async function waitForOtherJobsAndSendNotification() {
	const jobs = processJobStatuses( await getOtherJobsData() )
		.filter( job => !ignore.includes( job.name ) );

	const workflowFinished = jobs.every( job => [ 'success', 'failed', 'failed_parent' ].includes( job.status ) );

	// If any ignored job failed, all of its children will be marked as 'failed_parent', and thus will not trigger this check.
	const anyJobsFailed = jobs.some( job => job.status === 'failed' );

	if ( !workflowFinished ) {
		await new Promise( r => setTimeout( r, 30 * 1000 ) );

		return waitForOtherJobsAndSendNotification();
	}

	if ( anyJobsFailed ) {
		return execSync( task, { stdio: 'inherit' } );
	}

	console.log( 'All jobs were successful.' );
}

/**
 * Fetches and returns data of all jobs except the one where this script runs.
 */
async function getOtherJobsData() {
	const url = `https://circleci.com/api/v2/workflow/${ CIRCLE_WORKFLOW_ID }/job`;
	const options = { headers: { 'Circle-Token': CKE5_CIRCLE_TOKEN } };

	const response = await fetch( url, options );
	const data = await response.json();

	return data.items.filter( job => job.name !== CIRCLE_JOB );
}

/**
 * @param {Array.<String>} args
 * @returns {Object} result
 * @returns {String} result.task
 * @returns {Array<String>} result.ignore
 */
function parseArguments( args ) {
	const config = {
		string: [
			'task',
			'ignore'
		],

		default: {
			task: 'yarn ckeditor5-dev-ci-notify-circle-status',
			ignore: []
		}
	};

	let { task, ignore } = minimist( args, config );

	if ( typeof ignore === 'string' ) {
		ignore = [ ignore ];
	}

	ignore = ignore.flatMap( item => item.split( ',' ) );

	return { task, ignore };
}
