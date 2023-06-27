#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-env node */

const slackNotify = require( 'slack-notify' );
const fetch = require( 'node-fetch' );

const checkIfShouldNotify = require( '../lib/checkIfShouldNotify' );
const formatMessage = require( '../lib/formatMessage' );

// This script assumes that is being executed on Circle CI.
// Described environment variables should be added by the integrator.

const {
	/**
	 * @enum {Number} POSIX timestamp created when the script has begun the job.
	 */
	START_TIME,

	/**
	 * @enum {Number} POSIX timestamp created when the script has finished the job.
	 */
	END_TIME,

	/**
	 * @enum {String}
	 */
	CIRCLE_CI_TOKEN,

	/**
	 * @enum {String} URL where the notification should be sent.
	 */
	SLACK_WEBHOOK_URL,

	/**
	 * @enum {String} Optional. If set to "true", commit author will be hidden.
	 * See: https://github.com/ckeditor/ckeditor5/issues/9252.
	 */
	SLACK_NOTIFY_HIDE_AUTHOR,

	// Variables that are available by default in Circle environment.
	CIRCLE_BUILD_NUM,
	CIRCLE_BUILD_URL,
	CIRCLE_PROJECT_REPONAME,
	CIRCLE_PROJECT_USERNAME
} = process.env;

notifyCircleStatus();

async function notifyCircleStatus() {
	const fetchUrl = [
		'https://circleci.com/api/v1.1/project/github',
		CIRCLE_PROJECT_USERNAME,
		CIRCLE_PROJECT_REPONAME,
		CIRCLE_BUILD_NUM
	].join( '/' );

	const rawResponse = await fetch( fetchUrl, { headers: { 'Circle-Token': CIRCLE_CI_TOKEN } } );
	const response = await rawResponse.json();

	const commitBranch = response.all_commit_details[ 0 ].branch;
	const commitHash = response.all_commit_details[ 0 ].commit;
	const commitMessage = response.all_commit_details[ 0 ].subject;
	const commitUrl = response.all_commit_details[ 0 ].commit_url;
	const commitAuthor = response.all_commit_details[ 0 ].author_login;

	// TODO
	checkIfShouldNotify( {
		branch: 'master',
		event: 'push',
		exitCode: 1
	} );

	const message = formatMessage( {
		slackMessageUsername: 'Circle CI',
		githubAccount: CIRCLE_PROJECT_USERNAME,
		commitAuthor,
		shouldHideAuthor: SLACK_NOTIFY_HIDE_AUTHOR === 'true',
		iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Circleci-icon-logo.svg/475px-Circleci-icon-logo.svg.png',
		repositoryOwner: CIRCLE_PROJECT_USERNAME,
		repositoryName: CIRCLE_PROJECT_REPONAME,
		commitBranch,
		commitUrl,
		commitHash,
		jobUrl: CIRCLE_BUILD_URL,
		jobId: CIRCLE_BUILD_NUM,
		endTime: END_TIME,
		startTime: START_TIME,
		commitMessage
	} );

	return slackNotify( SLACK_WEBHOOK_URL )
		.send( message )
		.catch( err => console.log( 'API error occurred:', err ) );
}
