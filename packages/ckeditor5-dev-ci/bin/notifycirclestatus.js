#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-env node */

const allowedBranches = require( '../lib/data/allowedBranches.json' );
const formatMessage = require( '../lib/formatMessage' );
const printLog = require( '../lib/printLog' );
const slackNotify = require( 'slack-notify' );

const ALLOWED_EVENTS = [
	'api',
	'webhook'
];

// This script assumes that is being executed on Circle CI.
// Step it is used on should have set value: `when: on_fail`, since it does not
// check whether the build failed when determining whether the notification should be sent.
// Described environment variables starting with "CKE5" should be added by the integrator.

const {
	/**
	 * @enum {String} Token to a Github account with the scope: "repos". It is required for obtaining an author of
	 * the commit if the build failed. The repository can be private and we can't use the public API.
	 */
	CKE5_GITHUB_TOKEN,

	/**
	 * @enum {String} Required.
	 */
	CKE5_CIRCLE_TOKEN,

	/**
	 * @enum {String} Required. Webhook URL of the Slack channel where the notification should be sent.
	 */
	CKE5_SLACK_WEBHOOK_URL,

	/**
	 * @enum {String} Required. Value of `pipeline.trigger_source`.
	 * See: https://circleci.com/docs/variables/#pipeline-values.
	 */
	CKE5_TRIGGER_SOURCE,

	/**
	 * @enum {String} Optional. If both are defined, the script will use the URL as the commit URL.
	 * Otherwise, URL will be constructed using current repository data.
	 */
	CKE5_TRIGGERING_REPOSITORY_SLUG,
	CKE5_TRIGGERING_COMMIT_HASH,

	/**
	 * @enum {String} Optional. If set to "true", commit author will be hidden.
	 * See: https://github.com/ckeditor/ckeditor5/issues/9252.
	 */
	CKE5_SLACK_NOTIFY_HIDE_AUTHOR,

	// Variables that are available by default in Circle environment.
	CIRCLE_BRANCH,
	CIRCLE_BUILD_NUM,
	CIRCLE_BUILD_URL,
	CIRCLE_PROJECT_REPONAME,
	CIRCLE_PROJECT_USERNAME,
	CIRCLE_SHA1
} = process.env;

notifyCircleStatus();

async function notifyCircleStatus() {
	if ( !allowedBranches.includes( CIRCLE_BRANCH ) ) {
		printLog( `Aborting due to an invalid branch (${ CIRCLE_BRANCH }).` );

		process.exit();
	}

	if ( !ALLOWED_EVENTS.includes( CKE5_TRIGGER_SOURCE ) ) {
		printLog( `Aborting due to an invalid event type (${ CKE5_TRIGGER_SOURCE }).` );

		process.exit();
	}

	if ( !CKE5_GITHUB_TOKEN ) {
		throw new Error( 'Missing environment variable: CKE5_GITHUB_TOKEN' );
	}

	if ( !CKE5_SLACK_WEBHOOK_URL ) {
		throw new Error( 'Missing environment variable: CKE5_SLACK_WEBHOOK_URL' );
	}

	const jobData = await getJobData();

	const message = await formatMessage( {
		slackMessageUsername: 'Circle CI',
		iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Circleci-icon-logo.svg/475px-Circleci-icon-logo.svg.png',
		repositoryOwner: CIRCLE_PROJECT_USERNAME,
		repositoryName: CIRCLE_PROJECT_REPONAME,
		branch: CIRCLE_BRANCH,
		jobUrl: CIRCLE_BUILD_URL,
		jobId: CIRCLE_BUILD_NUM,
		githubToken: CKE5_GITHUB_TOKEN,
		triggeringCommitUrl: getTriggeringCommitUrl(),
		startTime: Math.ceil( ( new Date( jobData.started_at ) ).getTime() / 1000 ),
		endTime: Math.ceil( ( new Date() ) / 1000 ),
		shouldHideAuthor: CKE5_SLACK_NOTIFY_HIDE_AUTHOR === 'true'
	} );

	return slackNotify( CKE5_SLACK_WEBHOOK_URL )
		.send( message )
		.catch( err => console.log( 'API error occurred:', err ) );
}

async function getJobData() {
	const fetchUrl = [
		'https://circleci.com/api/v2/project/gh',
		CIRCLE_PROJECT_USERNAME,
		CIRCLE_PROJECT_REPONAME,
		'job',
		CIRCLE_BUILD_NUM
	].join( '/' );

	const fetchOptions = {
		method: 'GET',
		headers: { 'Circle-Token': CKE5_CIRCLE_TOKEN }
	};

	const rawResponse = await fetch( fetchUrl, fetchOptions );
	return rawResponse.json();
}

function getTriggeringCommitUrl() {
	let repoSlug, hash;

	if ( CKE5_TRIGGERING_REPOSITORY_SLUG && CKE5_TRIGGERING_COMMIT_HASH ) {
		repoSlug = CKE5_TRIGGERING_REPOSITORY_SLUG;
		hash = CKE5_TRIGGERING_COMMIT_HASH;
	} else {
		repoSlug = [ CIRCLE_PROJECT_USERNAME, CIRCLE_PROJECT_REPONAME ].join( '/' );
		hash = CIRCLE_SHA1;
	}

	return [ 'https://github.com', repoSlug, 'commit', hash ].join( '/' );
}
