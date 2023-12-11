/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const upath = require( 'upath' );
const fs = require( 'fs-extra' );
const { GraphQLClient } = require( 'graphql-request' );
const { logger } = require( '@ckeditor/ckeditor5-dev-utils' );
const {
	addSeconds,
	fromUnixTime,
	formatDistanceToNow,
	differenceInSeconds
} = require( 'date-fns' );
const prepareSearchQuery = require( './utils/preparesearchquery' );
const isIssueStale = require( './utils/isissuestale' );

const GRAPHQL_PATH = upath.join( __dirname, 'graphql' );

const queries = {
	getViewerLogin: readGraphQL( 'getviewerlogin' ),
	searchIssuesToStale: readGraphQL( 'searchissuestostale' ),
	getIssueTimelineItems: readGraphQL( 'getissuetimelineitems' ),
	addComment: readGraphQL( 'addcomment' ),
	getLabels: readGraphQL( 'getlabels' ),
	addLabels: readGraphQL( 'addlabels' ),
	removeLabels: readGraphQL( 'removelabels' )
};

/**
 * A GitHub client containing methods used to interact with GitHub using its GraphQL API.
 *
 * All methods handles paginated data and it supports a case when a request has exceeded the GitHub API rate limit.
 * In such a case, the request waits until the limit is reset and it is automatically sent again.
 */
module.exports = class GitHubRepository {
	constructor( authToken ) {
		/**
		 * @private
		 * @property {GraphQLClient}
		 */
		this.graphql = new GraphQLClient( 'https://api.github.com/graphql', {
			headers: {
				Accept: 'application/vnd.github.bane-preview+json',
				Authorization: `Bearer ${ authToken }`,
				'X-Github-Next-Global-ID': 1
			},
			cache: 'no-store'
		} );

		/**
		 * @private
		 * @property {Logger}
		 */
		this.logger = logger();
	}

	/**
	 * Returns the GitHub login of the currently authenticated user.
	 *
	 * @returns {Promise.<String>} The GitHub login of the currently authenticated user.
	 */
	async getViewerLogin() {
		return this.sendRequest( await queries.getViewerLogin )
			.then( data => data.viewer.login )
			.catch( error => {
				this.logger.error( 'Unexpected error when executing "#getViewerLogin()".', error );

				return Promise.reject();
			} );
	}

	/**
	 * Searches for all issues that matches the critieria of a stale issue.
	 *
	 * @param {SearchOptions} options Configuration options.
	 * @param {Function} onProgress Callback function called each time a response is received.
	 * @param {PageInfo} [pageInfo] Describes the current page of the returned result.
	 * @returns {Promise.<Array.<SearchResult>>} Array of all found stale issues.
	 */
	async searchIssuesToStale( options, onProgress, pageInfo = { done: 0, total: 0 } ) {
		const variables = {
			query: prepareSearchQuery( options ),
			cursor: pageInfo.cursor || null
		};

		return this.sendRequest( await queries.searchIssuesToStale, variables )
			.then( async data => {
				// Prepare a page info object that is shared between subsequent recursive calls to track the progress and offset.
				pageInfo = {
					...data.search.pageInfo,

					// Count next portion of the received data.
					done: pageInfo.done + data.search.nodes.length,

					// Set the total number of hits only once: when the response from the first (initial) search request was received.
					// Subsequent calls use a modified search start date, so the number of hits is no longer valid.
					total: pageInfo.total || data.search.issueCount
				};

				onProgress( {
					done: pageInfo.done,
					total: pageInfo.total
				} );

				const staleIssues = await this.parseIssuesToStale( options, data.search );

				// The GitHub "search" query returns maximum of 1000 results, even if the total number of hits is higher.
				// So, in case GitHub does not allow going to the next paginated chunk of data, but we have not received all the data yet...
				if ( !pageInfo.hasNextPage && pageInfo.done < pageInfo.total ) {
					// ...let's take the creation date of the last received issue and use it as the new moment to start the new search.
					// All received issues are sorted in a descending order by the date of creation, so the last issue is the oldest one
					// we fetched so far. This is the date that defines the moment to continue the search.
					options = {
						...options,
						searchDate: data.search.nodes.at( -1 ).createdAt
					};

					// Set the pagination flag, because we are going to sent a slightly modified request with different offset, indicated
					// by the creation date of the last received issue.
					pageInfo.hasNextPage = true;
					pageInfo.cursor = null;
				}

				const staleIssuesNextPage = pageInfo.hasNextPage ?
					await this.searchIssuesToStale( options, onProgress, pageInfo ) :
					[];

				return [ ...staleIssues, ...staleIssuesNextPage ];
			} )
			.catch( error => {
				this.logger.error( 'Unexpected error when executing "#searchIssuesToStale()".', error );

				return Promise.reject();
			} );
	}

	/**
	 * Fetches all timeline items for provided issue.
	 *
	 * @param {String} issueId Issue identifier for which we want to fetch timeline items.
	 * @param {PageInfo} [pageInfo] Describes the current page of the returned result.
	 * @returns {Promise.<Array.<TimelineItem>>} Array of all timeline items for provided issue.
	 */
	async getIssueTimelineItems( issueId, pageInfo = {} ) {
		const variables = {
			nodeId: issueId,
			cursor: pageInfo.cursor || null
		};

		return this.sendRequest( await queries.getIssueTimelineItems, variables )
			.then( async data => {
				pageInfo = data.node.timelineItems.pageInfo;

				const timelineItems = this.parseIssueTimelineItems( data.node.timelineItems );

				const timelineItemsNextPage = pageInfo.hasNextPage ?
					await this.getIssueTimelineItems( issueId, pageInfo ) :
					[];

				return [ ...timelineItems, ...timelineItemsNextPage ];
			} )
			.catch( error => {
				this.logger.error( 'Unexpected error when executing "#getIssueTimelineItems()".', error );

				return Promise.reject();
			} );
	}

	/**
	 * Adds new comment to the specified issue on GitHub.
	 *
	 * @param {String} issueId Issue identifier for which we want to add new comment.
	 * @param {String} comment Comment to add.
	 * @returns {Promise}
	 */
	async addComment( issueId, comment ) {
		const variables = {
			nodeId: issueId,
			comment
		};

		return this.sendRequest( await queries.addComment, variables )
			.catch( error => {
				this.logger.error( 'Unexpected error when executing "#addComment()".', error );

				return Promise.reject();
			} );
	}

	/**
	 * Fetches the specified label names from GitHub.
	 *
	 * @param {String} repositorySlug Identifies the repository, where the provided label exists.
	 * @param {Array.<String>} labelNames Label names to fetch.
	 * @returns {Promise.<Label>}
	 */
	async getLabels( repositorySlug, labelNames ) {
		const [ repositoryOwner, repositoryName ] = repositorySlug.split( '/' );
		const variables = {
			repositoryOwner,
			repositoryName,
			labelNames: labelNames.join( ' ' )
		};

		return this.sendRequest( await queries.getLabels, variables )
			.then( data => data.repository.labels.nodes )
			.catch( error => {
				this.logger.error( 'Unexpected error when executing "#getLabels()".', error );

				return Promise.reject();
			} );
	}

	/**
	 * Adds new labels to the specified issue on GitHub.
	 *
	 * @param {String} issueId Issue identifier for which we want to add labels.
	 * @param {Array.<String>} labelIds Labels to add.
	 * @returns {Promise}
	 */
	async addLabels( issueId, labelIds ) {
		const variables = {
			nodeId: issueId,
			labelIds
		};

		return this.sendRequest( await queries.addLabels, variables )
			.catch( error => {
				this.logger.error( 'Unexpected error when executing "#addLabels()".', error );

				return Promise.reject();
			} );
	}

	/**
	 * Removes labels from the specified issue on GitHub.
	 *
	 * @param {String} issueId Issue identifier for which we want to remove labels.
	 * @param {Array.<String>} labelIds Labels to remove.
	 * @returns {Promise}
	 */
	async removeLabels( issueId, labelIds ) {
		const variables = {
			nodeId: issueId,
			labelIds
		};

		return this.sendRequest( await queries.removeLabels, variables )
			.catch( error => {
				this.logger.error( 'Unexpected error when executing "#removeLabels()".', error );

				return Promise.reject();
			} );
	}

	/**
	 * Parses the received array of issues and fetches the remaining timeline items for any issue, if not everything was received in the
	 * initial request. Finally, filters issues based on whether they match the critieria of a stale issue.
	 *
	 * @private
	 * @param {SearchOptions} options Configuration options.
	 * @param {Object} data Received response to parse.
	 * @returns {Promise.<Array.<SearchResult>>} Array of all found stale issues.
	 */
	async parseIssuesToStale( options, data ) {
		const issuesPromises = data.nodes.map( async issue => {
			const pageInfo = issue.timelineItems.pageInfo;

			const timelineItems = this.parseIssueTimelineItems( issue.timelineItems );

			const timelineItemsNextPage = pageInfo.hasNextPage ?
				await this.getIssueTimelineItems( issue.id, pageInfo ) :
				[];

			return {
				...issue,
				lastReactedAt: issue.reactions.nodes[ 0 ]?.createdAt || null,
				timelineItems: [ ...timelineItems, ...timelineItemsNextPage ]
			};
		} );

		const issues = await Promise.all( issuesPromises );

		return issues
			.filter( issue => isIssueStale( issue, options ) )
			.map( issue => {
				return {
					id: issue.id,
					type: issue.__typename,
					url: issue.url,
					title: issue.title
				};
			} );
	}

	/**
	 * Parses the received array of timeline items for an issue.
	 *
	 * @private
	 * @param {Object} data Received response to parse.
	 * @returns {<Array.<TimelineItem>>} Array of all timeline items.
	 */
	parseIssueTimelineItems( data ) {
		return data.nodes.map( entry => {
			const timelineItem = {
				eventDate: entry.createdAt || entry.updatedAt
			};

			const author = entry.author?.login || entry.actor?.login;

			if ( author ) {
				timelineItem.author = author;
			}

			const label = entry.label?.name;

			if ( label ) {
				timelineItem.label = label;
			}

			return timelineItem;
		} );
	}

	/**
	 * Sends the GraphQL query to GitHub API.
	 *
	 * If the API rate limit is exceeded, the request is paused until the limit is reset. Then, the request is sent again.
	 *
	 * @private
	 * @param {String} query The GraphQL query to send.
	 * @param {Object} [variables={}] Variables required by the GraphQL query.
	 * @returns {Promise.<Object>} Data returned from the GitHub API.
	 */
	async sendRequest( query, variables = {} ) {
		return this.graphql.request( query, variables )
			.catch( async error => {
				const rateLimit = checkApiRateLimit( error );

				if ( rateLimit.isExceeded ) {
					this.logger.info(
						`⛔ The API limit is exceeded. Request is paused for ${ formatDistanceToNow( rateLimit.resetDate ) }.`
					);

					await new Promise( resolve => setTimeout( resolve, rateLimit.timeToWait * 1000 ) );

					this.logger.info( '📍 Re-sending postponed request.' );

					return this.sendRequest( query, variables );
				}

				return Promise.reject( error );
			} );
	}
};

/**
 * Reads the GraphQL query from filesystem.
 *
 * @param {String} queryName Filename of the GraphQL query to read.
 * @returns {Promise.<String>} The GraphQL query.
 */
function readGraphQL( queryName ) {
	return fs.readFile( upath.join( GRAPHQL_PATH, `${ queryName }.graphql` ), 'utf-8' );
}

/**
 * Parses the received error from GitHub API and checks if it concerns exceeding the API rate limit.
 *
 * @param {Object} error An error that was received from the GitHub API.
 * @returns {RateLimitExceeded} Information if and when the rate limit will be reset.
 */
function checkApiRateLimit( error ) {
	const currentDate = new Date();

	const isPrimaryRateLimitExeeded = error.response?.errors?.some(
		error => error.type === 'RATE_LIMITED'
	);

	if ( isPrimaryRateLimitExeeded ) {
		const resetDate = fromUnixTime( error.response.headers.get( 'x-ratelimit-reset' ) );
		const timeToWait = differenceInSeconds( resetDate, currentDate );

		return {
			isExceeded: true,
			resetDate,
			timeToWait
		};
	}

	const isSecondaryRateLimitExeeded = error.response?.headers?.has( 'retry-after' );

	if ( isSecondaryRateLimitExeeded ) {
		const timeToWait = Number( error.response.headers.get( 'retry-after' ) );
		const resetDate = addSeconds( currentDate, timeToWait );

		return {
			isExceeded: true,
			resetDate,
			timeToWait
		};
	}

	return {
		isExceeded: false
	};
}

/**
 * @typedef {Object} TimelineItem
 * @property {String} eventDate
 * @property {String} [author]
 * @property {String} [label]
 */

/**
 * @typedef {Object} Issue
 * @property {String} id
 * @property {Number} number
 * @property {String} url
 * @property {String} createdAt
 * @property {String|null} lastEditedAt
 * @property {String|null} lastReactedAt
 * @property {Array.<TimelineItem>} timelineItems
 */

/**
 * @typedef {Object} SearchResult
 * @property {String} id
 * @property {'Issue'|'PullRequest'} type
 * @property {String} url
 * @property {String} title
 */

/**
 * @typedef {Object} Label
 * @property {String} id
 * @property {String} name
 */

/**
 * @typedef {Object} PageInfo
 * @property {Boolean} [hasNextPage]
 * @property {String} [cursor]
 * @property {Number} [done]
 * @property {Number} [total]
 */

/**
 * @typedef {Object} Logger
 * @property {Function} info
 * @property {Function} warning
 * @property {Function} error
 */

/**
 * @typedef {Object} RateLimitExceeded
 * @property {Boolean} isExceeded
 * @property {String} [resetDate]
 * @property {Number} [timeToWait]
 */
