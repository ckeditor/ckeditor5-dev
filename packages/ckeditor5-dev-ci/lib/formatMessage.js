/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-env node */

'use strict';

const members = require( './members.json' );
const bots = require( './bots.json' );

const REPOSITORY_REGEXP = /github\.com\/([^/]+)\/([^/]+)/;

module.exports = function formatMessage( options ) {
	const repoMatch = options.commitUrl.match( REPOSITORY_REGEXP );
	const repoUrl = `https://github.com/${ options.repositoryOwner }/${ options.repositoryName }`;

	return {
		username: options.slackMessageUsername,
		text: getNotifierMessage( options ),
		icon_url: options.iconUrl,
		unfurl_links: 1,
		attachments: [ {
			color: 'danger',
			fields: [ {
				title: 'Repository (branch)',
				value: [
					`<${ repoUrl }|${ options.repositoryName }>`,
					`(<${ repoUrl }/tree/${ options.commitBranch }|${ options.commitBranch }>)`
				].join( ' ' ),
				short: true
			}, {
				title: 'Commit',
				value: `<${ options.commitUrl }|${ options.commitHash.substring( 0, 7 ) }>`,
				short: true
			}, {
				title: 'Build number',
				value: `<${ options.jobUrl }|#${ options.jobId }>`,
				short: true
			}, {
				title: 'Build time',
				value: getExecutionTime( options.endTime, options.startTime ),
				short: true
			}, {
				title: 'Commit message',
				value: getFormattedMessage( options.commitMessage, repoMatch[ 1 ], repoMatch[ 2 ] ),
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

	// If the author of the commit could not be obtained, let's ping the entire team.
	if ( !slackAccount ) {
		return `@channel (${ options.commitAuthor }), could you take a look?`;
	}

	if ( bots.includes( options.githubAccount ) ) {
		return '_This commit is a result of merging a branch into another branch._';
	}

	return `<@${ slackAccount }>, could you take a look?`;
}

/**
 * Returns string representing amount of time passed between two timestamps.
 *
 * @param {Number} endTime
 * @param {Number} startTime
 * @returns {String}
 */
function getExecutionTime( endTime, startTime ) {
	if ( !endTime && !startTime ) {
		return 'TODO';
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
