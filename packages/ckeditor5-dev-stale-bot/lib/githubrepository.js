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
	searchStaleIssues: readGraphQL( 'searchstaleissues' )
};

/**
 * A GitHub client containing methods used to fetch data from GitHub using GraphQL API.
 *
 * It handles paginated data and it supports a case when a request has exceeded the GitHub API rate limit.
 * In such a case, the request waits until the limit is reset and it is automatically sent again.
 */
module.exports = class GitHubRepository {
	constructor( authToken ) {
		/**
		 * @protected
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
		 * @protected
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
	 * @param {PageInfo} [pageInfo] Describes the current page of the returned result.
	 * @returns {Promise.<Array.<SearchResult>>} Array of all found stale issues.
	 */
	async searchStaleIssues( options, onProgress, pageInfo = { done: 0, total: 0 } ) {
		const variables = {
			query: prepareSearchQuery( options ),
			cursor: pageInfo.cursor || null
		};

		return this.sendRequest( await queries.searchStaleIssues, variables )
			.then( async data => {
				pageInfo = {
					...data.search.pageInfo,
					done: pageInfo.done + data.search.nodes.length,
					total: pageInfo.total || data.search.issueCount
				};

				onProgress( {
					done: pageInfo.done,
					total: pageInfo.total
				} );

				const staleIssues = await this.parseStaleIssues( options, data.search );

				if ( !pageInfo.hasNextPage && pageInfo.done !== pageInfo.total ) {
					options.dateBeforeStale = data.search.nodes.at( -1 ).createdAt;

					pageInfo.hasNextPage = true;
					pageInfo.cursor = null;
				}

				const staleIssuesNextPage = pageInfo.hasNextPage ?
					await this.searchStaleIssues( options, onProgress, pageInfo ) :
					[];

				return [ ...staleIssues, ...staleIssuesNextPage ];
			} )
			.catch( error => {
				if ( error ) {
					this.logger.error( 'Unexpected error when executing "#searchStaleIssues()".', error );
				}

				return Promise.reject();
			} );
	}

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

	async parseStaleIssues( options, data ) {
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

	parseIssueTimelineItems( data ) {
		return data.nodes.map( entry => {
			const timelineItem = {
				eventDate: entry.createdAt || entry.updatedAt
			};

			if ( entry.author || entry.actor ) {
				timelineItem.author = entry.author?.login || entry.actor?.login || null;
			}

			if ( entry.label ) {
				timelineItem.label = entry.label.name;
			}

			return timelineItem;
		} );
	}

	/**
	 * Sends the GraphQL query to GitHub API.
	 *
	 * If the API rate limit is exceeded, the request is paused until the limit is reset. Then, the request is sent again.
	 *
	 * @param {String} query The GraphQL query to send.
	 * @param {Object} variables Variables required by the GraphQL query.
	 * @returns {Promise} Data returned from the GitHub API.
	 */
	async sendRequest( query, variables ) {
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
		dateBeforeStale
	} = options;

	return [
		`repo:${ repositorySlug }`,
		`created:<${ dateBeforeStale }`,
		`type:${ type }`,
		'state:open',
		'sort:created-desc',
		...ignoredLabels.map( label => `-label:${ label }` )
	].join( ' ' );
}

/**
 * Checks if the provided issue is considered as stale.
 *
 * @param {Issue} issue Issue to check.
 * @param {Options} options Configuration options.
 * @returns {Boolean} Returns `true` if issue is considered as stale, or `false` otherwise.
 */
function isIssueStale( issue, options ) {
	const {
		dateBeforeStale,
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
		.every( date => isBefore( parseISO( date ), parseISO( dateBeforeStale ) ) );
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
 * @typedef {Object} ReactionEvent
 * @property {String} createdAt
 */

/**
 * @typedef {Object} Reactions
 * @property {Array.<ReactionEvent>} nodes
 */

/**
 * @typedef {Object} LabelEvent
 * @property {String} createdAt
 * @property {Object} actor
 * @property {String|null} actor.login
 * @property {Object} label
 * @property {String} label.name
 */

/**
 * @typedef {Object} CommentEvent
 * @property {String} updatedAt
 * @property {Object} author
 * @property {String|null} author.login
 */

/**
 * @typedef {Object} TimelineItems
 * @property {Array.<LabelEvent|CommentEvent>} nodes
 */

/**
 * @typedef {Object} Issue
 * @property {String} id
 * @property {Number} number
 * @property {String} createdAt
 * @property {String|null} lastEditedAt
 * @property {String|null} lastReactedAt
 * @property {TimelineItems} timelineItems
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
