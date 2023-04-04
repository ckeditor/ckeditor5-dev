/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

// A map that translates GitHub accounts to Slack ids.
const members = require( './members.json' );

const REPOSITORY_REGEXP = /github\.com\/([^/]+)\/([^/]+)/;

const fetch = require( 'node-fetch' );
const slackNotify = require( 'slack-notify' );

/**
 * @param {Object} options
 * @param {String} options.repositorySlug
 * @param {Number} options.startTime
 * @param {Number} options.endTime
 * @param {String} options.githubToken
 * @param {String} options.slackWebhookUrl
 * @param {String} options.branch
 * @param {String} options.commit
 * @param {String} options.notifyCommitUrl
 * @param {Boolean} options.shouldHideAuthor
 * @param {String} options.jobUrl
 * @param {String} options.jobId
 * @returns {Promise}
 */
module.exports = async function notifyTravisStatus( options ) {
	const commitUrl = getCommitUrl( {
		commit: options.commit,
		notifyCommitUrl: options.notifyCommitUrl,
		repositorySlug: options.repositorySlug
	} );
	const commitDetails = await getCommitDetails( commitUrl, options.githubToken );

	const [ buildRepoOwner, buildRepoName ] = options.repositorySlug.split( '/' );

	const slackAccount = members[ commitDetails.author ];
	const shortCommit = commitUrl.split( '/' ).pop().substring( 0, 7 );
	const repoMatch = commitUrl.match( REPOSITORY_REGEXP );

	const messageData = {
		username: 'Travis CI',
		text: getNotifierMessage( {
			slackAccount,
			githubAccount: commitDetails.author,
			shouldHideAuthor: options.shouldHideAuthor
		} ),
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
							`(<https://github.com/${ buildRepoOwner }/${ buildRepoName }/tree/${ options.branch }|${ options.branch }>)`
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
						value: `<${ options.jobUrl }|#${ options.jobId }>`,
						short: true
					},
					{
						title: 'Build time',
						value: getExecutionTime( options.endTime, options.startTime ),
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
	};

	return slackNotify( options.slackWebhookUrl )
		.send( messageData )
		.catch( err => console.log( 'API error occurred:', err ) );
};

/**
 * Returns string representing amount of time passed between two timestamps.
 *
 * @param {Number} endTime
 * @param {Number} startTime
 * @returns {String}
 */
function getExecutionTime( endTime, startTime ) {
	const totalMs = ( endTime - startTime ) * 1000;
	const date = new Date( totalMs );
	const hours = date.getUTCHours();
	const minutes = date.getUTCMinutes();
	const seconds = date.getUTCSeconds();

	const stringParts = [];

	if ( hours ) {
		stringParts.push( `${ hours } hr.` );
	}

	if ( minutes ) {
		stringParts.push( `${ minutes } min.` );
	}

	if ( seconds ) {
		stringParts.push( `${ seconds } sec.` );
	}

	return stringParts.join( ' ' );
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
 * @param {Object} options
 * @param {String} options.notifyCommitUrl
 * @param {String} options.repositorySlug
 * @param {String} options.commit
 * @returns {String}
 */
function getCommitUrl( options ) {
	if ( options.notifyCommitUrl ) {
		return options.notifyCommitUrl;
	}

	return `https://github.com/${ options.repositorySlug }/commit/${ options.commit }`;
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
 * @param {String} githubToken Github token used for authorization a request,
 * @returns {Promise.<Object>}
 */
function getCommitDetails( commitUrl, githubToken ) {
	const apiGithubUrlCommit = getGithubApiUrl( commitUrl );
	const options = {
		method: 'GET',
		credentials: 'include',
		headers: {
			authorization: `token ${ githubToken }`
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
 * @param {Object} options
 * @param {Boolean} options.shouldHideAuthor
 * @param {String} options.slackAccount
 * @param {String} options.githubAccount
 * @returns {String}
 */
function getNotifierMessage( options ) {
	if ( options.shouldHideAuthor ) {
		return '_The author of the commit was hidden. <https://github.com/ckeditor/ckeditor5/issues/9252|Read more about why.>_';
	}

	if ( !options.slackAccount ) {
		return '_The author of the commit could not be obtained._';
	}

	// Slack and GitHub names for bots are equal.
	if ( options.slackAccount === options.githubAccount ) {
		return '_This commit is a result of merging a branch into another branch._';
	}

	return `<@${ options.slackAccount }>, could you take a look?`;
}
