/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import isIssueOrPullRequestActive from './isissueorpullrequestactive.js';
import findStaleDate from './findstaledate.js';

/**
 * Checks whether issue or pull request should be unstaled, because it was active after it was staled.
 *
 * @param {IssueOrPullRequest} issueOrPullRequest Issue or pull request to check.
 * @param {Options} options Configuration options.
 * @returns {boolean}
 */
export default function isIssueOrPullRequestToUnstale( issueOrPullRequest, options ) {
	const staleDate = findStaleDate( issueOrPullRequest, options );

	return isIssueOrPullRequestActive( issueOrPullRequest, staleDate, options );
}
