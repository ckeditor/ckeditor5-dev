/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import isIssueOrPullRequestActive from './isissueorpullrequestactive.js';

/**
 * Checks whether issue or pull request should be staled, because it was not active since the defined moment of time.
 *
 * @param {IssueOrPullRequest} issueOrPullRequest Issue or pull request to check.
 * @param {Options} options Configuration options.
 * @returns {boolean}
 */
export default function isIssueOrPullRequestToStale( issueOrPullRequest, options ) {
	const { staleDate } = options;

	return !isIssueOrPullRequestActive( issueOrPullRequest, staleDate, options );
}
