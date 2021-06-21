#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-env node */

// This script assumes that is being executed on Travis CI. It requires following environment variables:
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

const REPOSITORY_REGEXP = /github\.com\/([^/]+)\/([^/]+)/;

const buildBranch = process.env.TRAVIS_BRANCH;

const ALLOWED_BRANCHES = [
	'stable',
	'master',
	'master-revisions'
];

const ALLOWED_EVENTS = [
	'push',
	'cron',
	'api'
];

printDebugLog( 'Starting script: ' + __filename );

// Send a notification only for main branches...
if ( !ALLOWED_BRANCHES.includes( buildBranch ) ) {
	printDebugLog( `Aborting due to an invalid branch (${ buildBranch }).` );

	process.exit();
}

// ...and an event that triggered the build is correct...
if ( !ALLOWED_EVENTS.includes( process.env.TRAVIS_EVENT_TYPE ) ) {
	printDebugLog( `Aborting due to an invalid event type (${ process.env.TRAVIS_EVENT_TYPE }).` );

	process.exit();
}

// ...and for builds that failed.
if ( process.env.TRAVIS_TEST_RESULT == 0 ) {
	printDebugLog( 'The build did not fail. The notification will not be sent.' );

	process.exit();
}

const fetch = require( 'node-fetch' );
const slack = require( 'slack-notify' )( process.env.SLACK_WEBHOOK_URL );

// A map that translates GitHub accounts to Slack ids.
const members = require( './members.json' );

slack.onError = err => {
	console.log( 'API error occurred:', err );
};

main();

/**
 * The main function.
 *
 * @async
 */
async function main() {
	const commitUrl = getCommitUrl();
	const commitDetails = await getCommitDetails( commitUrl );

	const [ buildRepoOwner, buildRepoName ] = process.env.TRAVIS_REPO_SLUG.split( '/' );
	const execTime = getExecutionTime( parseInt( process.env.END_TIME ), parseInt( process.env.START_TIME ) );

	const slackAccount = members[ commitDetails.author ];
	const shortCommit = commitUrl.split( '/' ).pop().substring( 0, 7 );
	const repoMatch = commitUrl.match( REPOSITORY_REGEXP );

	printDebugLog( 'Sending a message.' );

	slack.send( {
		username: 'Travis CI',
		text: getNotifierMessage( slackAccount, commitDetails.author ),
		icon_url: 'https://a.slack-edge.com/66f9/img/services/travis_36.png',
		unfurl_links: 1,
		attachments: [
			{
				color: 'danger',
				fields: [
					{
						title: 'Repository (branch)',
						value: [
							`<https://github.com/${ buildRepoOwner }/${ buildRepoName }|${ buildRepoName }>`,
							`(<https://github.com/${ buildRepoOwner }/${ buildRepoName }/tree/${ buildBranch }|${ buildBranch }>)`
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
						value: `<${ process.env.TRAVIS_JOB_WEB_URL }|#${ process.env.TRAVIS_JOB_NUMBER }>`,
						short: true
					},
					{
						title: 'Build time',
						value: `${ execTime.mins } min ${ execTime.secs } sec`,
						short: true
					},
					{
						title: 'Commit message',
						value: getFormattedMessage( commitDetails.message, repoMatch[ 1 ], repoMatch[ 2 ] ),
						short: false
					}
				]
			}
		]
	} );

	printDebugLog( 'Sent.' );
}

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

/**
 * Returns a URL to the commit details on GitHub.
 *
 * @returns {String}
 */
function getCommitUrl() {
	const { SLACK_NOTIFY_COMMIT_URL, TRAVIS_REPO_SLUG, TRAVIS_COMMIT } = process.env;

	if ( SLACK_NOTIFY_COMMIT_URL ) {
		return SLACK_NOTIFY_COMMIT_URL;
	}

	return `https://github.com/${ TRAVIS_REPO_SLUG }/commit/${ TRAVIS_COMMIT }`;
}

/**
 * Returns a URL to GitHub API which returns details of the commit that caused the CI to fail its job.
 *
 * @param {String} commitUrl The URL to the commit on GitHub.
 * @returns {String}
 */
function getGithubApiUrl( commitUrl ) {
	return commitUrl.replace( 'github.com/', 'api.github.com/repos/' ).replace( '/commit/', '/commits/' );
}

/**
 * Returns a promise that resolves the commit details (author and message) based on the specified GitHub URL.
 *
 * @param {String} commitUrl The URL to the commit on GitHub.
 * @returns {Promise.<Object>}
 */
function getCommitDetails( commitUrl ) {
	const apiGithubUrlCommit = getGithubApiUrl( commitUrl );
	const options = {
		method: 'GET',
		credentials: 'include',
		headers: {
			authorization: `token ${ process.env.GITHUB_TOKEN }`
		}
	};

	return fetch( apiGithubUrlCommit, options )
		.then( response => response.json() )
		.then( json => ( {
			author: json.author.login,
			message: json.commit.message
		} ) );
}

/**
 * Returns the additional message that will be added to the notifier post.
 *
 * @param {String} slackAccount
 * @param {String} githubAccount
 * @returns {String}
 */
function getNotifierMessage( slackAccount, githubAccount ) {
	if ( process.env.SLACK_NOTIFY_HIDE_AUTHOR == 'true' ) {
		return '_The author of the commit was hidden. <https://github.com/ckeditor/ckeditor5/issues/9252|Read more about why.>_';
	}

	if ( !slackAccount ) {
		return '_The author of the commit could not be obtained._';
	}

	// Slack and GitHub names for bots are equal.
	if ( slackAccount === githubAccount ) {
		return '_This commit is a result of merging a branch into another branch._';
	}

	return `<@${ slackAccount }>, could you take a look?`;
}

/**
 * @param {String} message
 */
function printDebugLog( message ) {
	if ( process.env.DEBUG == 'true' ) {
		console.log( '[Slack Notification]', message );
	}
}
