#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
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
// The Notifier job should also be executed when Job A ends with an error. In such a case, Job B is still blocked.
// Hence, we need to iterate over all jobs and verify if their dependencies ended with an error to unlock
// executing the final part of the workflow.

const {
	/**
	 * Required. CircleCI API token used for obtaining data about the build from API.
	 */
	CKE5_CIRCLE_TOKEN,

	// Variables that are available by default in Circle environment.
	CIRCLE_WORKFLOW_ID,
	CIRCLE_JOB
} = process.env;

const { task } = parseArguments( process.argv.slice( 2 ) );
const FAILING_PARENT_FLAG = 'failing_parent';

waitForOtherJobsAndSendNotification()
	.catch( err => {
		console.error( err );

		process.exit( 1 );
	} );

async function waitForOtherJobsAndSendNotification() {
	const jobs = await getOtherJobsData();

	processJobStatuses( jobs, FAILING_PARENT_FLAG );

	const workflowFinished = jobs.every( job => [ 'success', 'failed', FAILING_PARENT_FLAG ].includes( job.status ) );
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
 */
function parseArguments( args ) {
	const config = {
		string: [
			'task'
		],

		default: {
			task: 'yarn ckeditor5-dev-ci-notify-circle-status'
		}
	};

	return minimist( args, config );
}
