#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-env node */

import formatMessage from '../lib/format-message.js';
import slackNotify from 'slack-notify';

const ALLOWED_BRANCHES = [
	'stable',
	'master'
];

const ALLOWED_EVENTS = [
	'push',
	'cron',
	'api'
];

// This script assumes that is being executed on Travis CI.
// Described environment variables should be added by the integrator.

const {
	/**
	 * POSIX timestamps created when the script has begun and ended the job.
	 * Timestamps should be in seconds instead of milliseconds.
	 */
	START_TIME,
	END_TIME,

	/**
	 * Token to a Github account with the scope: "repos". It is required for obtaining an author of
	 * the commit if the build failed. The repository can be private and we can't use the public API.
	 */
	GITHUB_TOKEN,

	/**
	 * Required. Webhook URL of the Slack channel where the notification should be sent.
	 */
	SLACK_WEBHOOK_URL,

	/**
	 * Optional. If defined, the script will use the URL as the commit URL.
	 * Otherwise, URL will be constructed using current repository data.
	 */
	SLACK_NOTIFY_COMMIT_URL,

	/**
	 * Optional. If set to "true", commit author will be hidden.
	 * See: https://github.com/ckeditor/ckeditor5/issues/9252.
	 */
	SLACK_NOTIFY_HIDE_AUTHOR,

	// Variables that are available by default in Travis environment.
	TRAVIS_BRANCH,
	TRAVIS_COMMIT,
	TRAVIS_EVENT_TYPE,
	TRAVIS_JOB_NUMBER,
	TRAVIS_JOB_WEB_URL,
	TRAVIS_REPO_SLUG,
	TRAVIS_TEST_RESULT
} = process.env;

notifyTravisStatus();

async function notifyTravisStatus() {
	// Send a notification only for main branches...
	if ( !ALLOWED_BRANCHES.includes( TRAVIS_BRANCH ) ) {
		console.log( `Aborting slack notification due to an invalid branch (${ TRAVIS_BRANCH }).` );

		process.exit();
	}

	// ...and an event that triggered the build is correct...
	if ( !ALLOWED_EVENTS.includes( TRAVIS_EVENT_TYPE ) ) {
		console.log( `Aborting slack notification due to an invalid event type (${ TRAVIS_EVENT_TYPE }).` );

		process.exit();
	}

	// ...and for builds that failed.
	if ( TRAVIS_TEST_RESULT == 0 ) {
		console.log( 'The build did not fail. The notification will not be sent.' );

		process.exit();
	}

	const [ repositoryOwner, repositoryName ] = TRAVIS_REPO_SLUG.split( '/' );

	const message = await formatMessage( {
		slackMessageUsername: 'Travis CI',
		iconUrl: 'https://a.slack-edge.com/66f9/img/services/travis_36.png',
		repositoryOwner,
		repositoryName,
		branch: TRAVIS_BRANCH,
		buildTitle: 'Job number',
		buildUrl: TRAVIS_JOB_WEB_URL,
		buildId: '#' + TRAVIS_JOB_NUMBER,
		githubToken: GITHUB_TOKEN,
		triggeringCommitUrl: SLACK_NOTIFY_COMMIT_URL || `https://github.com/${ TRAVIS_REPO_SLUG }/commit/${ TRAVIS_COMMIT }`,
		startTime: Number( START_TIME ),
		endTime: Number( END_TIME ),
		shouldHideAuthor: SLACK_NOTIFY_HIDE_AUTHOR === 'true'
	} );

	return slackNotify( SLACK_WEBHOOK_URL )
		.send( message )
		.catch( err => console.log( 'API error occurred:', err ) );
}
