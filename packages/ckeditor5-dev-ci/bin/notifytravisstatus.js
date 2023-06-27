#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-env node */

const slackNotify = require( 'slack-notify' );

const checkIfShouldNotify = require( '../lib/checkIfShouldNotify' );
const formatMessage = require( '../lib/formatMessage' );
const getCommitDetails = require( '../lib/getCommitDetails' );

// This script assumes that is being executed on Travis CI.
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
	 * @enum {String} Token to a Github account with the scope: "repos". It is required for obtaining an author of
	 * the commit if the build failed. The repository can be private and we can't use the public API.
	 */
	GITHUB_TOKEN,

	/**
	 * @enum {String} URL where the notification should be sent.
	 */
	SLACK_WEBHOOK_URL,

	/**
	 * @enum {String} Optional. If defined, the script will use the URL as the commit URL.
	 * Otherwise, URL will be constructed using commit repository data and its hash.
	 */
	SLACK_NOTIFY_COMMIT_URL,

	/**
	 * @enum {String} Optional. If set to "true", commit author will be hidden.
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
	checkIfShouldNotify( {
		branch: TRAVIS_BRANCH,
		event: TRAVIS_EVENT_TYPE,
		exitCode: TRAVIS_TEST_RESULT
	} );

	const commitUrl = SLACK_NOTIFY_COMMIT_URL || `https://github.com/${ TRAVIS_REPO_SLUG }/commit/${ TRAVIS_COMMIT }`;
	const { githubAccount, commitAuthor, commitMessage } = await getCommitDetails( commitUrl, GITHUB_TOKEN );
	const [ repositoryOwner, repositoryName ] = TRAVIS_REPO_SLUG.split( '/' );

	const message = formatMessage( {
		slackMessageUsername: 'Travis CI',
		githubAccount,
		commitAuthor,
		shouldHideAuthor: SLACK_NOTIFY_HIDE_AUTHOR === 'true',
		iconUrl: 'https://a.slack-edge.com/66f9/img/services/travis_36.png',
		repositoryOwner,
		repositoryName,
		commitBranch: TRAVIS_BRANCH,
		commitUrl,
		commitHash: TRAVIS_COMMIT,
		jobUrl: TRAVIS_JOB_WEB_URL,
		jobId: TRAVIS_JOB_NUMBER,
		endTime: END_TIME,
		startTime: START_TIME,
		commitMessage
	} );

	return slackNotify( SLACK_WEBHOOK_URL )
		.send( message )
		.catch( err => console.log( 'API error occurred:', err ) );
}
