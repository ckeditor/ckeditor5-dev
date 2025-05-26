/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { bots, members } from './data/index.js';

const REPOSITORY_REGEXP = /github\.com\/([^/]+)\/([^/]+)/;

/**
 * @param {object} options
 * @param {string} options.slackMessageUsername
 * @param {string} options.iconUrl
 * @param {string} options.repositoryOwner
 * @param {string} options.repositoryName
 * @param {string} options.branch
 * @param {string} options.buildTitle
 * @param {string} options.buildUrl
 * @param {string} options.buildId
 * @param {string} options.githubToken
 * @param {string} options.triggeringCommitUrl
 * @param {number} options.startTime
 * @param {number} options.endTime
 * @param {boolean} options.shouldHideAuthor
 */
export default async function formatMessage( options ) {
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
}

/**
 * Returns the additional message that will be added to the notifier post.
 *
 * @param {object} options
 * @param {boolean} options.shouldHideAuthor
 * @param {string|null} options.githubAccount
 * @param {string} options.commitAuthor
 * @returns {string}
 */
function getNotifierMessage( options ) {
	if ( options.shouldHideAuthor ) {
		return '_The author of the commit was hidden. <https://github.com/ckeditor/ckeditor5/issues/9252|Read more about why.>_';
	}

	const slackAccount = findSlackAccount( options.githubAccount );
	const botActionMessage = '_Automated stuff happened on one of the branches. Got time to have a look at it, anyone?_';

	if ( bots.includes( options.githubAccount ) ) {
		return botActionMessage;
	}

	// If the author of the commit could not be obtained, let's ping the entire team.
	if ( !slackAccount ) {
		if ( bots.includes( options.commitAuthor ) ) {
			return botActionMessage;
		}

		return `<!channel> (${ options.commitAuthor }), could you take a look?`;
	}

	return `<@${ slackAccount }>, could you take a look?`;
}

/**
 * @param {string|null} githubAccount
 * @returns {string|null}
 */
function findSlackAccount( githubAccount ) {
	if ( !githubAccount ) {
		return null;
	}

	for ( const [ key, value ] of Object.entries( members ) ) {
		if ( key.toLowerCase() === githubAccount.toLowerCase() ) {
			return value;
		}
	}

	return null;
}

/**
 * Returns string representing amount of time passed between two timestamps.
 * Timestamps should be in seconds instead of milliseconds.
 *
 * @param {number} startTime
 * @param {number} endTime
 * @returns {string}
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
 * @param {string} commitMessage
 * @param {string} triggeringCommitUrl
 * @returns {string}
 */
function getFormattedMessage( commitMessage, triggeringCommitUrl ) {
	if ( !commitMessage ) {
		return '_Unavailable._';
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
 * @param {string} triggeringCommitUrl The URL to the commit on GitHub.
 * @param {string} githubToken Github token used for authorization a request,
 * @returns {Promise.<object>}
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
 * @param {string} triggeringCommitUrl The URL to the commit on GitHub.
 * @returns {string}
 */
function getGithubApiUrl( triggeringCommitUrl ) {
	return triggeringCommitUrl.replace( 'github.com/', 'api.github.com/repos/' ).replace( '/commit/', '/commits/' );
}
