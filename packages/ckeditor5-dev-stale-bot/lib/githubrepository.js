/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
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
const isIssueOrPullRequestToStale = require( './utils/isissueorpullrequesttostale' );
const isIssueOrPullRequestToUnstale = require( './utils/isissueorpullrequesttounstale' );
const isIssueOrPullRequestToClose = require( './utils/isissueorpullrequesttoclose' );
const isPendingIssueToStale = require( './utils/ispendingissuetostale' );
const isPendingIssueToUnlabel = require( './utils/ispendingissuetounlabel' );

const GRAPHQL_PATH = upath.join( __dirname, 'graphql' );

const queries = {
	getViewerLogin: readGraphQL( 'getviewerlogin' ),
	searchIssuesOrPullRequests: readGraphQL( 'searchissuesorpullrequests' ),
	searchPendingIssues: readGraphQL( 'searchpendingissues' ),
	getIssueOrPullRequestTimelineItems: readGraphQL( 'getissueorpullrequesttimelineitems' ),
	addComment: readGraphQL( 'addcomment' ),
	getLabels: readGraphQL( 'getlabels' ),
	addLabels: readGraphQL( 'addlabels' ),
	removeLabels: readGraphQL( 'removelabels' ),
	closeIssue: readGraphQL( 'closeissue' ),
	closePullRequest: readGraphQL( 'closepullrequest' )
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
	 * @returns {Promise.<String>}
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
	 * Searches for all issues and pull requests that matches the criteria of a stale issue.
	 *
	 * @param {'Issue'|'PullRequest'} type Type of resource to search.
	 * @param {Options} options Configuration options.
	 * @param {Function} onProgress Callback function called each time a response is received.
	 * @param {PageInfo} [pageInfo] Describes the current page of the returned result.
	 * @returns {Promise.<SearchIssuesOrPullRequestsToStaleResult>}
	 */
	async searchIssuesOrPullRequestsToStale( type, options, onProgress, pageInfo = { done: 0, total: 0 } ) {
		const query = prepareSearchQuery( {
			type,
			searchDate: options.searchDate || options.staleDate,
			repositorySlug: options.repositorySlug,
			ignoredLabels: [
				...options.staleLabels,
				...type === 'Issue' ? options.ignoredIssueLabels : options.ignoredPullRequestLabels
			]
		} );

		const variables = {
			query,
			cursor: pageInfo.cursor || null
		};

		return this.sendRequest( await queries.searchIssuesOrPullRequests, variables )
			.then( async data => {
				const issuesOrPullRequests = await this.parseIssuesOrPullRequests( data.search );

				const issuesOrPullRequestsToStale = issuesOrPullRequests.filter( issue => isIssueOrPullRequestToStale( issue, options ) );

				const { nextPageInfo, nextOptions } = this.calculateNextSearchOffset( data.search, options, pageInfo );

				onProgress( {
					done: nextPageInfo.done,
					total: nextPageInfo.total
				} );

				const issuesOrPullRequestsToStaleNextPage = nextPageInfo.hasNextPage ?
					await this.searchIssuesOrPullRequestsToStale( type, nextOptions, onProgress, nextPageInfo ) :
					[];

				return [ ...issuesOrPullRequestsToStale, ...issuesOrPullRequestsToStaleNextPage ].map( mapNodeToResult );
			} )
			.catch( error => {
				this.logger.error( 'Unexpected error when executing "#searchIssuesOrPullRequestsToStale()".', error );

				return Promise.reject();
			} );
	}

	/**
	 * Searches for all stale issues and pull requests that should be closed or unstaled.
	 *
	 * @param {Options} options Configuration options.
	 * @param {Function} onProgress Callback function called each time a response is received.
	 * @param {PageInfo} [pageInfo] Describes the current page of the returned result.
	 * @returns {Promise.<SearchStaleIssuesOrPullRequestsResult>}
	 */
	async searchStaleIssuesOrPullRequests( options, onProgress, pageInfo = { done: 0, total: 0 } ) {
		const query = prepareSearchQuery( {
			searchDate: options.searchDate,
			repositorySlug: options.repositorySlug,
			labels: options.staleLabels
		} );

		const variables = {
			query,
			cursor: pageInfo.cursor || null
		};

		return this.sendRequest( await queries.searchIssuesOrPullRequests, variables )
			.then( async data => {
				const issuesOrPullRequests = await this.parseIssuesOrPullRequests( data.search );

				const issuesOrPullRequestsToClose = issuesOrPullRequests
					.filter( entry => isIssueOrPullRequestToClose( entry, options ) );

				const issuesOrPullRequestsToUnstale = issuesOrPullRequests
					.filter( entry => isIssueOrPullRequestToUnstale( entry, options ) );

				const { nextPageInfo, nextOptions } = this.calculateNextSearchOffset( data.search, options, pageInfo );

				onProgress( {
					done: nextPageInfo.done,
					total: nextPageInfo.total
				} );

				const {
					issuesOrPullRequestsToClose: issuesOrPullRequestsToCloseNextPage = [],
					issuesOrPullRequestsToUnstale: issuesOrPullRequestsToUnstaleNextPage = []
				} = nextPageInfo.hasNextPage ?
					await this.searchStaleIssuesOrPullRequests( nextOptions, onProgress, nextPageInfo ) :
					{};

				return {
					issuesOrPullRequestsToClose: [
						...issuesOrPullRequestsToClose,
						...issuesOrPullRequestsToCloseNextPage
					].map( mapNodeToResult ),
					issuesOrPullRequestsToUnstale: [
						...issuesOrPullRequestsToUnstale,
						...issuesOrPullRequestsToUnstaleNextPage
					].map( mapNodeToResult )
				};
			} )
			.catch( error => {
				this.logger.error( 'Unexpected error when executing "#searchStaleIssuesOrPullRequests()".', error );

				return Promise.reject();
			} );
	}

	/**
	 * Searches for all pending issues that should be staled or unlabeled.
	 *
	 * @param {Options} options Configuration options.
	 * @param {Function} onProgress Callback function called each time a response is received.
	 * @param {PageInfo} [pageInfo] Describes the current page of the returned result.
	 * @returns {Promise.<SearchIssuesOrPullRequestsToStaleResult>}
	 */
	async searchPendingIssues( options, onProgress, pageInfo = { done: 0, total: 0 } ) {
		const query = prepareSearchQuery( {
			type: 'Issue',
			searchDate: options.searchDate,
			repositorySlug: options.repositorySlug,
			labels: options.pendingIssueLabels,
			ignoredLabels: [
				...options.ignoredIssueLabels
			]
		} );

		const variables = {
			query,
			cursor: pageInfo.cursor || null
		};

		return this.sendRequest( await queries.searchPendingIssues, variables )
			.then( async data => {
				const pendingIssues = this.parsePendingIssues( data.search );

				const pendingIssuesToStale = pendingIssues.filter( entry => isPendingIssueToStale( entry, options ) );
				const pendingIssuesToUnlabel = pendingIssues.filter( entry => isPendingIssueToUnlabel( entry ) );

				const { nextPageInfo, nextOptions } = this.calculateNextSearchOffset( data.search, options, pageInfo );

				onProgress( {
					done: nextPageInfo.done,
					total: nextPageInfo.total
				} );

				const {
					pendingIssuesToStale: pendingIssuesToStaleNextPage = [],
					pendingIssuesToUnlabel: pendingIssuesToUnlabelNextPage = []
				} = nextPageInfo.hasNextPage ?
					await this.searchPendingIssues( nextOptions, onProgress, nextPageInfo ) :
					{};

				return {
					pendingIssuesToStale: [ ...pendingIssuesToStale, ...pendingIssuesToStaleNextPage ].map( mapNodeToResult ),
					pendingIssuesToUnlabel: [ ...pendingIssuesToUnlabel, ...pendingIssuesToUnlabelNextPage ].map( mapNodeToResult )
				};
			} )
			.catch( error => {
				this.logger.error( 'Unexpected error when executing "#searchPendingIssues()".', error );

				return Promise.reject();
			} );
	}

	/**
	 * Fetches all timeline items for provided issue or pull request.
	 *
	 * @param {String} nodeId Issue or pull request identifier for which we want to fetch timeline items.
	 * @param {PageInfo} [pageInfo] Describes the current page of the returned result.
	 * @returns {Promise.<Array.<TimelineItem>>}
	 */
	async getIssueOrPullRequestTimelineItems( nodeId, pageInfo = {} ) {
		const variables = {
			nodeId,
			cursor: pageInfo.cursor || null
		};

		return this.sendRequest( await queries.getIssueOrPullRequestTimelineItems, variables )
			.then( async data => {
				pageInfo = data.node.timelineItems.pageInfo;

				const timelineItems = this.parseIssueOrPullRequestTimelineItems( data.node.timelineItems );

				const timelineItemsNextPage = pageInfo.hasNextPage ?
					await this.getIssueOrPullRequestTimelineItems( nodeId, pageInfo ) :
					[];

				return [ ...timelineItems, ...timelineItemsNextPage ];
			} )
			.catch( error => {
				this.logger.error( 'Unexpected error when executing "#getIssueOrPullRequestTimelineItems()".', error );

				return Promise.reject();
			} );
	}

	/**
	 * Adds new comment to the specified issue or pull request on GitHub.
	 *
	 * @param {String} nodeId Issue or pull request identifier for which we want to add new comment.
	 * @param {String} comment Comment to add.
	 * @returns {Promise}
	 */
	async addComment( nodeId, comment ) {
		const variables = {
			nodeId,
			comment
		};

		return this.sendRequest( await queries.addComment, variables )
			.catch( error => {
				this.logger.error( 'Unexpected error when executing "#addComment()".', error );

				return Promise.reject();
			} );
	}

	/**
	 * Fetches the specified labels from GitHub.
	 *
	 * @param {String} repositorySlug Identifies the repository, where the provided labels exist.
	 * @param {Array.<String>} labelNames Label names to fetch.
	 * @returns {Promise.<Array.<String>>}
	 */
	async getLabels( repositorySlug, labelNames ) {
		if ( !labelNames.length ) {
			return Promise.resolve( [] );
		}

		const [ repositoryOwner, repositoryName ] = repositorySlug.split( '/' );
		const variables = {
			repositoryOwner,
			repositoryName,
			labelNames: labelNames.join( ' ' )
		};

		return this.sendRequest( await queries.getLabels, variables )
			.then( data => data.repository.labels.nodes.map( label => label.id ) )
			.catch( error => {
				this.logger.error( 'Unexpected error when executing "#getLabels()".', error );

				return Promise.reject();
			} );
	}

	/**
	 * Adds new labels to the specified issue or pull request on GitHub.
	 *
	 * @param {String} nodeId Issue or pull request identifier for which we want to add labels.
	 * @param {Array.<String>} labelIds Labels to add.
	 * @returns {Promise}
	 */
	async addLabels( nodeId, labelIds ) {
		const variables = {
			nodeId,
			labelIds
		};

		return this.sendRequest( await queries.addLabels, variables )
			.catch( error => {
				this.logger.error( 'Unexpected error when executing "#addLabels()".', error );

				return Promise.reject();
			} );
	}

	/**
	 * Removes labels from the specified issue or pull request on GitHub.
	 *
	 * @param {String} nodeId Issue or pull request identifier for which we want to remove labels.
	 * @param {Array.<String>} labelIds Labels to remove.
	 * @returns {Promise}
	 */
	async removeLabels( nodeId, labelIds ) {
		const variables = {
			nodeId,
			labelIds
		};

		return this.sendRequest( await queries.removeLabels, variables )
			.catch( error => {
				this.logger.error( 'Unexpected error when executing "#removeLabels()".', error );

				return Promise.reject();
			} );
	}

	/**
	 * Closes issue or pull request.
	 *
	 * @param {'Issue'|'PullRequest'} type Type of resource to close.
	 * @param {String} nodeId Issue or pull request identifier to close.
	 * @returns {Promise}
	 */
	async closeIssueOrPullRequest( type, nodeId ) {
		const variables = {
			nodeId
		};

		const query = type === 'Issue' ? await queries.closeIssue : await queries.closePullRequest;

		return this.sendRequest( query, variables )
			.catch( error => {
				this.logger.error( 'Unexpected error when executing "#closeIssueOrPullRequest()".', error );

				return Promise.reject();
			} );
	}

	/**
	 * Prepares the page pointers and search options for the next search request.
	 *
	 * @private
	 * @param {Object} data Received response to parse.
	 * @param {Options} options Configuration options.
	 * @param {PageInfo} pageInfo Describes the current page of the returned result.
	 * @returns {Object} result
	 * @returns {PageInfo} result.nextPageInfo
	 * @returns {Options} result.nextOptions
	 */
	calculateNextSearchOffset( data, options, pageInfo ) {
		const nextPageInfo = {
			...data.pageInfo,

			// Count next portion of the received data.
			done: pageInfo.done + data.nodes.length,

			// Set the total number of hits only once: when the response from the first (initial) search request was received.
			// Subsequent calls use a modified search start date, so the number of hits is no longer valid.
			total: pageInfo.total || data.issueCount
		};

		const nextOptions = {
			...options
		};

		// The GitHub "search" query returns maximum of 1000 results, even if the total number of hits is higher.
		// So, in case GitHub does not allow going to the next paginated chunk of data, but we have not received all the data yet...
		if ( !nextPageInfo.hasNextPage && nextPageInfo.done < nextPageInfo.total ) {
			// ...let's take the creation date of the last received resource (issue or pull request) and use it as the new moment to start
			// the new search. All received resources are sorted in a descending order by the date of creation, so the last resource is the
			// oldest one we fetched so far. This is the date that defines the moment to continue the search.
			nextOptions.searchDate = data.nodes.at( -1 ).createdAt;

			// Set the pagination flag, because we are going to sent a slightly modified request with different offset, indicated
			// by the creation date of the last received resource.
			nextPageInfo.hasNextPage = true;
			nextPageInfo.cursor = null;
		}

		return {
			nextPageInfo,
			nextOptions
		};
	}

	/**
	 * Parses the received array of issues or pull requests and fetches the remaining timeline items, if not everything was received in the
	 * initial request.
	 *
	 * @private
	 * @param {Object} data Received response to parse.
	 * @returns {Promise.<Array.<IssueOrPullRequest>>}
	 */
	parseIssuesOrPullRequests( data ) {
		const promises = data.nodes.map( async node => {
			const pageInfo = node.timelineItems.pageInfo;

			const timelineItems = this.parseIssueOrPullRequestTimelineItems( node.timelineItems );

			const timelineItemsNextPage = pageInfo.hasNextPage ?
				await this.getIssueOrPullRequestTimelineItems( node.id, pageInfo ) :
				[];

			return {
				...node,
				lastReactedAt: node.reactions.nodes[ 0 ]?.createdAt || null,
				timelineItems: [ ...timelineItems, ...timelineItemsNextPage ]
			};
		} );

		return Promise.all( promises );
	}

	/**
	 * Parses the received array of timeline items for an issue or pull request.
	 *
	 * @private
	 * @param {Object} data Received response to parse.
	 * @returns {Array.<TimelineItem>}
	 */
	parseIssueOrPullRequestTimelineItems( data ) {
		return data.nodes.map( node => {
			const timelineItem = {
				eventDate: node.createdAt || node.updatedAt
			};

			const author = node.author?.login || node.actor?.login;

			if ( author ) {
				timelineItem.author = author;
			}

			const label = node.label?.name;

			if ( label ) {
				timelineItem.label = label;
			}

			return timelineItem;
		} );
	}

	/**
	 * Parses the received array of issues or pull requests and fetches the remaining timeline items, if not everything was received in the
	 * initial request.
	 *
	 * @private
	 * @param {Object} data Received response to parse.
	 * @returns {Array.<PendingIssue>}
	 */
	parsePendingIssues( data ) {
		return data.nodes.map( node => {
			const lastComment = node.comments.nodes[ 0 ];

			return {
				...node,
				labels: node.labels.nodes.map( label => label.name ),
				lastComment: lastComment ? {
					createdAt: lastComment.createdAt,
					isExternal: lastComment.authorAssociation !== 'MEMBER'
				} : null
			};
		} );
	}

	/**
	 * Sends the GraphQL query to GitHub API. If the API rate limit is exceeded, the request is paused until the limit is reset.
	 * Then, the request is sent again.
	 *
	 * @private
	 * @param {String} query The GraphQL query to send.
	 * @param {Object} [variables={}] Variables required by the GraphQL query.
	 * @returns {Promise.<Object>}
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
 * @returns {Promise.<String>}
 */
function readGraphQL( queryName ) {
	return fs.readFile( upath.join( GRAPHQL_PATH, `${ queryName }.graphql` ), 'utf-8' );
}

/**
 * Parses the received error from GitHub API and checks if it concerns exceeding the API rate limit. If yes, it returns information when the
 * rate limit will be reset.
 *
 * @param {Object} error An error that was received from the GitHub API.
 * @returns {RateLimitExceeded}
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
 * Maps the issue or pull request to the result object.
 *
 * @param {IssueOrPullRequest|PendingIssue} node
 * @returns {IssueOrPullRequestResult}
 */
function mapNodeToResult( node ) {
	return {
		id: node.id,
		type: node.type,
		title: node.title,
		url: node.url
	};
}

/**
 * @typedef {Object} TimelineItem
 * @property {String} eventDate
 * @property {String} [author]
 * @property {String} [label]
 */

/**
 * @typedef {Object} Comment
 * @property {String} createdAt
 * @property {Boolean} isExternal
 */

/**
 * @typedef {Object} IssueOrPullRequest
 * @property {String} id
 * @property {'Issue'|'PullRequest'} type
 * @property {Number} number
 * @property {String} title
 * @property {String} url
 * @property {String} createdAt
 * @property {String|null} lastEditedAt
 * @property {String|null} lastReactedAt
 * @property {Array.<TimelineItem>} timelineItems
 */

/**
 * @typedef {Object} PendingIssue
 * @property {String} id
 * @property {'Issue'} type
 * @property {String} title
 * @property {String} url
 * @property {Array.<String>} labels
 * @property {Comment|null} lastComment
 */

/**
 * @typedef {Object} IssueOrPullRequestResult
 * @property {String} id
 * @property {'Issue'|'PullRequest'} type
 * @property {String} url
 * @property {String} title
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

/**
 * @typedef {Array.<IssueOrPullRequestResult>} SearchIssuesOrPullRequestsToStaleResult
 */

/**
 * @typedef {Object} SearchStaleIssuesOrPullRequestsResult
 * @property {Array.<IssueOrPullRequestResult>} issuesOrPullRequestsToClose
 * @property {Array.<IssueOrPullRequestResult>} issuesOrPullRequestsToUnstale
 */
