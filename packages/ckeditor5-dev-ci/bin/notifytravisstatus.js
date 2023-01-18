#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-env node */

// This script assumes that is being executed on Travis CI. It requires following environment variables:
//
// - SLACK_WEBHOOK_URL - a URL where the notification should be sent
// - START_TIME - POSIX time (when the script has begun the job)
// - END_TIME - POSIX time (when the script has finished the job)
// - GITHUB_TOKEN - token to a Github account with the scope: "repos". It is requires for obtaining an author of
//   the commit if the build failed. The repository can be private and we can't use the public API.
//
// If the `SLACK_NOTIFY_COMMIT_URL` environment variable is defined, the script use the URL as the commit URL.
// Otherwise, a marge of variables `TRAVIS_REPO_SLUG` and `TRAVIS_COMMIT` will be used.
//
// Pinging an author of the commit can be disabled by defining the `SLACK_NOTIFY_HIDE_AUTHOR` environment variable
// to `"true"` (`SLACK_NOTIFY_HIDE_AUTHOR="true"`). See: https://github.com/ckeditor/ckeditor5/issues/9252.
//
// In order to enable the debug mode, set the `DEBUG=true` as the environment variable.

const buildBranch = process.env.TRAVIS_BRANCH;

const ALLOWED_BRANCHES = [
	'stable',
	'master'
];

const ALLOWED_EVENTS = [
	'push',
	'cron',
	'api'
];

// Send a notification only for main branches...
if ( !ALLOWED_BRANCHES.includes( buildBranch ) ) {
	printLog( `Aborting due to an invalid branch (${ buildBranch }).` );

	process.exit();
}

// ...and an event that triggered the build is correct...
if ( !ALLOWED_EVENTS.includes( process.env.TRAVIS_EVENT_TYPE ) ) {
	printLog( `Aborting due to an invalid event type (${ process.env.TRAVIS_EVENT_TYPE }).` );

	process.exit();
}

// ...and for builds that failed.
if ( process.env.TRAVIS_TEST_RESULT == 0 ) {
	printLog( 'The build did not fail. The notification will not be sent.' );

	process.exit();
}

const notifyTravisStatus = require( '../lib/notifytravisstatus' );

const options = {
	repositorySlug: process.env.TRAVIS_REPO_SLUG,
	startTime: parseInt( process.env.START_TIME ),
	endTime: parseInt( process.env.END_TIME ),
	githubToken: process.env.GITHUB_TOKEN,
	slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
	branch: buildBranch,
	commit: process.env.TRAVIS_COMMIT,
	notifyCommitUrl: process.env.SLACK_NOTIFY_COMMIT_URL,
	shouldHideAuthor: process.env.SLACK_NOTIFY_HIDE_AUTHOR === 'true',
	jobUrl: process.env.TRAVIS_JOB_WEB_URL,
	jobId: process.env.TRAVIS_JOB_NUMBER
};

notifyTravisStatus( options )
	.catch( error => {
		console.error( error );

		throw error;
	} );

/**
 * @param {String} message
 */
function printLog( message ) {
	console.log( '[Slack Notification]', message );
}
