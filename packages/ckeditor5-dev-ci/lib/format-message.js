/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-env node */

'use strict';

const fetch = require( 'node-fetch' );

const bots = require( './data/bots.json' );
const members = require( './data/members.json' );

const REPOSITORY_REGEXP = /github\.com\/([^/]+)\/([^/]+)/;

/**
 * @param {String} slackMessageUsername
 * @param {String} iconUrl
 * @param {String} repositoryOwner
 * @param {String} repositoryName
 * @param {String} branch
 * @param {String} buildTitle
 * @param {String} buildUrl
 * @param {String} buildId
 * @param {String} githubToken
 * @param {String} triggeringCommitUrl
 * @param {Number} startTime
 * @param {Number} endTime
 * @param {Boolean} shouldHideAuthor
 */
module.exports = async function formatMessage( options ) {
	const commitDetails = await getCommitDetails( options.triggeringCommitUrl, options.githubToken );
	const repoUrl = `https://github.com/${ options.repositoryOwner }/${ options.repositoryName }`;

	return {
		username: options.slackMessageUsername,
		icon_url: options.iconUrl,
		unfurl_links: 1,
		text: getNotifierMessage( { ...options, ...commitDetails } ),
		attachments: [ {
			color: 'danger',
			fields: [ {
				title: 'Repository (branch)',
				value: `<${ repoUrl }|${ options.repositoryName }> (<${ repoUrl }/tree/${ options.branch }|${ options.branch }>)`,
				short: true
			}, {
				title: options.buildTitle,
				value: `<${ options.buildUrl }|${ options.buildId }>`,
				short: true
			}, {
				title: 'Commit',
				value: `<${ options.triggeringCommitUrl }|${ commitDetails.hash.substring( 0, 7 ) }>`,
				short: true
			}, {
				title: 'Build time',
				value: getExecutionTime( options.startTime, options.endTime ),
				short: true
			}, {
				title: 'Commit message',
				value: getFormattedMessage( commitDetails.commitMessage, options.triggeringCommitUrl ),
				short: false
			} ]
		} ]
	};
};

/**
 * Returns the additional message that will be added to the notifier post.
 *
 * @param {Object} options
 * @param {Boolean} options.shouldHideAuthor
 * @param {String|null} options.githubAccount
 * @param {String} options.commitAuthor
 * @returns {String}
 */
function getNotifierMessage( options ) {
	const slackAccount = members[ options.githubAccount ] || null;

	if ( options.shouldHideAuthor ) {
		return '_The author of the commit was hidden. <https://github.com/ckeditor/ckeditor5/issues/9252|Read more about why.>_';
	}

	if ( bots.includes( options.githubAccount ) ) {
		return '_This commit is a result of merging a branch into another branch._';
	}

	// If the author of the commit could not be obtained, let's ping the entire team.
	if ( !slackAccount ) {
		return `@channel (${ options.commitAuthor }), could you take a look?`;
	}

	return `<@${ slackAccount }>, could you take a look?`;
}

/**
 * Returns string representing amount of time passed between two timestamps.
 * Timestamps should be in seconds instead of milliseconds.
 *
 * @param {Number} startTime
 * @param {Number} endTime
 * @returns {String}
 */
function getExecutionTime( startTime, endTime ) {
	if ( !startTime || !endTime ) {
		return 'Unavailable.';
	}

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

	if ( !stringParts.length ) {
		return '0 sec.';
	}

	return stringParts.join( ' ' );
}

/**
 * Replaces `#Id` and `Repo/Owner#Id` with URls to Github Issues.
 *
 * @param {String} commitMessage
 * @param {String} triggeringCommitUrl
 * @returns {string}
 */
function getFormattedMessage( commitMessage, triggeringCommitUrl ) {
	if ( !commitMessage ) {
		return 'Unavailable';
	}

	const [ , repoOwner, repoName ] = triggeringCommitUrl.match( REPOSITORY_REGEXP );

	return commitMessage
		.replace( / #(\d+)/g, ( _, issueId ) => {
			return ` <https://github.com/${ repoOwner }/${ repoName }/issues/${ issueId }|#${ issueId }>`;
		} )
		.replace( /([\w-]+\/[\w-]+)#(\d+)/g, ( _, repoSlug, issueId ) => {
			return `<https://github.com/${ repoSlug }/issues/${ issueId }|${ repoSlug }#${ issueId }>`;
		} );
}

/**
 * Returns a promise that resolves the commit details (author and message) based on the specified GitHub URL.
 *
 * @param {String} triggeringCommitUrl The URL to the commit on GitHub.
 * @param {String} githubToken Github token used for authorization a request,
 * @returns {Promise.<Object>}
 */
function getCommitDetails( triggeringCommitUrl, githubToken ) {
	const apiGithubUrlCommit = getGithubApiUrl( triggeringCommitUrl );
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
			githubAccount: json.author ? json.author.login : null,
			commitAuthor: json.commit.author.name,
			commitMessage: json.commit.message,
			hash: json.sha
		} ) );
}

/**
 * Returns a URL to GitHub API which returns details of the commit that caused the CI to fail its job.
 *
 * @param {String} triggeringCommitUrl The URL to the commit on GitHub.
 * @returns {String}
 */
function getGithubApiUrl( triggeringCommitUrl ) {
	return triggeringCommitUrl.replace( 'github.com/', 'api.github.com/repos/' ).replace( '/commit/', '/commits/' );
}
