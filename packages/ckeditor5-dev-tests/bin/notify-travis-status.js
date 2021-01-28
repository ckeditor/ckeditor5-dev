#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-env node */

/*

This script assumes that is being executed on Travis CI. It requires three environment variables:
- SLACK_WEBHOOK_URL - a URL where the notification should be sent
- START_TIME - POSIX time (when the script has begun the job)
- END_TIME - POSIX time (when the script has finished the job)

In order to enable the debug mode, set the `DEBUG=true` as the environment variable.

 */

const buildBranch = process.env.TRAVIS_BRANCH;

const acceptedBranches = [
	'master',
	'master-revisions'
];

const acceptedEvents = [
	'push',
	'cron',
	'api'
];

printDebugLog( 'Starting script: ' + __filename );

// Send a notification only for main branches...
if ( !acceptedBranches.includes( buildBranch ) ) {
	printDebugLog( `Aborting due to an invalid branch (${ buildBranch }).` );

	process.exit();
}

// ...and an event that triggered the build is correct...
if ( !acceptedEvents.includes( process.env.TRAVIS_EVENT_TYPE ) ) {
	printDebugLog( `Aborting due to an invalid event type (${ process.env.TRAVIS_EVENT_TYPE }).` );

	process.exit();
}

// ...and for builds that failed.
if ( process.env.TRAVIS_TEST_RESULT == 0 ) {
	printDebugLog( 'The build did not fail. The notification will not be sent.' );

	process.exit();
}

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

const slack = require( 'slack-notify' )( SLACK_WEBHOOK_URL );

const buildId = process.env.TRAVIS_JOB_NUMBER.split( '.' )[ 0 ];
const buildUrl = process.env.TRAVIS_JOB_WEB_URL;
const buildCommit = process.env.TRAVIS_COMMIT;
const [ owner, repo ] = process.env.TRAVIS_REPO_SLUG.split( '/' );
const commitUrl = `https://github.com/${ owner }/${ repo }/commit/${ buildCommit }`;
const shortCommit = buildCommit.substring( 0, 7 );
const execTime = getExecutionTime( parseInt( process.env.END_TIME ), parseInt( process.env.START_TIME ) );

slack.onError = err => {
	console.log( 'API error occurred:', err );
};

const data = {
	icon_url: 'https://a.slack-edge.com/66f9/img/services/travis_36.png',
	unfurl_links: 1,
	username: 'Travis CI',
	attachments: [
		{
			color: 'danger',
			fields: [
				{
					title: 'Repository (branch)',
					value: [
						`<https://github.com/${ owner }/${ repo }|${ repo }>`,
						`(<https://github.com/${ owner }/${ repo }/tree/${ buildBranch }|${ buildBranch }>)`
					].join( ' ' ),
					short: true
				},
				{
					title: 'Commit',
					value: `<${ commitUrl }|${ shortCommit }>`,
					short: true
				},
				{
					title: 'Build number',
					value: `<${ buildUrl }|#${ buildId }>`,
					short: true
				},
				{
					title: 'Build time',
					value: `${ execTime.mins } min ${ execTime.secs } sec`,
					short: true
				},
				{
					title: 'Commit message',
					value: getFormattedMessage( process.env.TRAVIS_COMMIT_MESSAGE, owner, repo ),
					short: false
				}
			]
		}
	]
};

slack.send( data );

/**
 * Returns an object that compares two dates.
 *
 * @param {Number} endTime
 * @param {Number} startTime
 * @returns {Object}
 */
function getExecutionTime( endTime, startTime ) {
	const execTime = {
		ms: endTime - startTime
	};

	execTime.days = Math.floor( execTime.ms / 86400 );
	execTime.hours = Math.floor( ( execTime.ms - 86400 * execTime.days ) / 3600 );
	execTime.mins = Math.floor( ( ( execTime.ms - 86400 * execTime.days ) - 3600 * execTime.hours ) / 60 );
	execTime.secs = ( ( execTime.ms - 86400 * execTime.days ) - 3600 * execTime.hours ) - 60 * execTime.mins;

	return execTime;
}

/**
 * Replaces `#Id` and `Repo/Owner#Id` with URls to Github Issues.
 *
 * @param {String} message
 * @param {String} repoOwner
 * @param {String} repoName
 * @returns {string}
 */
function getFormattedMessage( message, repoOwner, repoName ) {
	return message
		.replace( / #(\d+)/g, ( _, issueId ) => {
			return ` <https://github.com/${ repoOwner }/${ repoName }/issues/${ issueId }|#${ issueId }>`;
		} )
		.replace( /([\w-]+\/[\w-]+)#(\d+)/g, ( _, repoSlug, issueId ) => {
			return `<https://github.com/${ repoSlug }/issues/${ issueId }|${ repoSlug }#${ issueId }>`;
		} );
}

function printDebugLog( message ) {
	if ( process.env.DEBUG == 'true' ) {
		console.log( '[Slack Notification]', message );
	}
}
