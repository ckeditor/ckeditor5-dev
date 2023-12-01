/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const upath = require( 'upath' );
const fs = require( 'fs-extra' );
const { GraphQLClient } = require( 'graphql-request' );
const { logger } = require( '@ckeditor/ckeditor5-dev-utils' );
const {
	isBefore,
	parseISO,
	addSeconds,
	fromUnixTime,
	formatDistanceToNow,
	differenceInSeconds
} = require( 'date-fns' );

const GRAPHQL_PATH = upath.join( __dirname, 'graphql' );

const queries = {
	getIssueTimelineItems: readGraphQL( 'getissuetimelineitems' ),
	getViewerLogin: readGraphQL( 'getviewerlogin' ),
	searchIssuesToStale: readGraphQL( 'searchissuestostale' )
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
				if ( error ) {
					this.logger.error( 'Unexpected error when executing "#getViewerLogin()".', error );
				}

				return Promise.reject();
			} );
	}

	/**
	 * Searches for all issues that matches the critieria of a stale issue.
	 *
	 * @param {Options} options Configuration options.
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
					options.searchDate = data.search.nodes.at( -1 ).createdAt;

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
				if ( error ) {
					this.logger.error( 'Unexpected error when executing "#searchIssuesToStale()".', error );
				}

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
				if ( error ) {
					this.logger.error( 'Unexpected error when executing "#getIssueTimelineItems()".', error );
				}

				return Promise.reject();
			} );
	}

	/**
	 * Parses the received array of issues and fetches the remaining timeline items for any issue, if not everything was received in the
	 * initial request. Finally, filters issues based on whether they match the critieria of a stale issue.
	 *
	 * @private
	 * @param {Options} options Configuration options.
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
			.map( issue => ( {
				id: issue.id,
				slug: `${ options.repositorySlug }#${ issue.number }`
			} ) );
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
 * Creates a query to search for issues or pull requests that potentially could be considered as stale ones.
 *
 * @param {Options} options Configuration options.
 * @returns {String} Search query to sent to GitHub.
 */
function prepareSearchQuery( options ) {
	const {
		type,
		ignoredLabels,
		repositorySlug,
		searchDate
	} = options;

	return [
		`repo:${ repositorySlug }`,
		`created:<${ searchDate }`,
		`type:${ type }`,
		'state:open',
		'sort:created-desc',
		...ignoredLabels.map( label => `-label:${ label }` )
	].join( ' ' );
}

/**
 * Verifies the last activity dates from an issue to check if they all have occured before the moment defining the stale issue.
 *
 * The activity dates are:
 * - the moment of issue creation,
 * - the moment of the last edition of issue,
 * - the moment of adding or editing a comment,
 * - the moment of adding last reaction to issue,
 * - the moment of changing a label.
 *
 * Some activity entries may be ignored and not taken into account in the calculation, if so specified in the configuration.
 *
 * @param {Issue} issue Issue to check.
 * @param {Options} options Configuration options.
 * @returns {Boolean} Returns `true` if issue is considered as stale, or `false` otherwise.
 */
function isIssueStale( issue, options ) {
	const {
		staleDate,
		ignoredActivityLogins,
		ignoredActivityLabels
	} = options;

	const dates = [
		issue.lastEditedAt,
		issue.lastReactedAt,
		...issue.timelineItems
			.filter( entry => {
				if ( !entry.author ) {
					return true;
				}

				return !ignoredActivityLogins.includes( entry.author );
			} )
			.filter( entry => {
				if ( !entry.label ) {
					return true;
				}

				return !ignoredActivityLabels.includes( entry.label );
			} )
			.map( entry => entry.eventDate )
	];

	return dates
		.filter( Boolean )
		.every( date => isBefore( parseISO( date ), parseISO( staleDate ) ) );
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
 * @property {String} createdAt
 * @property {String|null} lastEditedAt
 * @property {String|null} lastReactedAt
 * @property {Array.<TimelineItem>} timelineItems
 */

/**
 * @typedef {Object} SearchResult
 * @property {String} id
 * @property {String} slug
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
