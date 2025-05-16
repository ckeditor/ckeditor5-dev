#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-env node */

import slackNotify from 'slack-notify';
import formatMessage from '../lib/format-message.js';

// This script assumes that is being executed on Circle CI.
// Step it is used on should have set value: `when: on_fail`, since it does not
// check whether the build failed when determining whether the notification should be sent.
// Described environment variables starting with "CKE5" should be added by the integrator.

const {
	/**
	 * Required. Value of Circle's `pipeline.number` variable.
	 */
	CKE5_PIPELINE_NUMBER,

	/**
	 * Required. Token to a Github account with the scope: "repos". It is required for obtaining an author of
	 * the commit if the build failed. The repository can be private and we can't use the public API.
	 */
	CKE5_GITHUB_TOKEN,

	/**
	 * Required. CircleCI API token used for obtaining data about the build from API.
	 */
	CKE5_CIRCLE_TOKEN,

	/**
	 * Required. Webhook URL of the Slack channel where the notification should be sent.
	 */
	CKE5_SLACK_WEBHOOK_URL,

	/**
	 * Optional. If both are defined, the script will use the URL as the commit URL.
	 * Otherwise, URL will be constructed using current repository data.
	 */
	CKE5_TRIGGER_REPOSITORY_SLUG,
	CKE5_TRIGGER_COMMIT_HASH,

	/**
	 * Optional. If set to "true", commit author will be hidden.
	 * See: https://github.com/ckeditor/ckeditor5/issues/9252.
	 */
	CKE5_SLACK_NOTIFY_HIDE_AUTHOR,

	// Variables that are available by default in Circle environment.
	CIRCLE_BRANCH,
	CIRCLE_BUILD_NUM,
	CIRCLE_PROJECT_REPONAME,
	CIRCLE_PROJECT_USERNAME,
	CIRCLE_SHA1,
	CIRCLE_WORKFLOW_ID
} = process.env;

notifyCircleStatus();

async function notifyCircleStatus() {
	if ( !CKE5_GITHUB_TOKEN ) {
		throw new Error( 'Missing environment variable: CKE5_GITHUB_TOKEN' );
	}

	if ( !CKE5_SLACK_WEBHOOK_URL ) {
		throw new Error( 'Missing environment variable: CKE5_SLACK_WEBHOOK_URL' );
	}

	const jobData = await getJobData();
	const buildUrl = [
		'https://app.circleci.com/pipelines/github',
		CIRCLE_PROJECT_USERNAME,
		CIRCLE_PROJECT_REPONAME,
		CKE5_PIPELINE_NUMBER,
		'workflows',
		CIRCLE_WORKFLOW_ID
	].join( '/' );

	const message = await formatMessage( {
		slackMessageUsername: 'Circle CI',
		iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Circleci-icon-logo.svg/475px-Circleci-icon-logo.svg.png',
		repositoryOwner: CIRCLE_PROJECT_USERNAME,
		repositoryName: CIRCLE_PROJECT_REPONAME,
		branch: CIRCLE_BRANCH,
		buildTitle: 'Workflow ID',
		buildUrl,
		buildId: CIRCLE_WORKFLOW_ID.split( '-' )[ 0 ] + '-...',
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

	if ( CKE5_TRIGGER_REPOSITORY_SLUG && CKE5_TRIGGER_COMMIT_HASH ) {
		repoSlug = CKE5_TRIGGER_REPOSITORY_SLUG.trim();
		hash = CKE5_TRIGGER_COMMIT_HASH.trim();
	} else {
		repoSlug = [ CIRCLE_PROJECT_USERNAME, CIRCLE_PROJECT_REPONAME ].join( '/' );
		hash = CIRCLE_SHA1;
	}

	return [ 'https://github.com', repoSlug, 'commit', hash ].join( '/' );
}
