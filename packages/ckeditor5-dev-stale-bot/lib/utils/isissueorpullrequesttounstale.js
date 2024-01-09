/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const isIssueOrPullRequestActive = require( './isissueorpullrequestactive' );
const findStaleDate = require( './findstaledate' );

/**
 * Checks whether issue or pull request should be unstaled, because it was active after it was staled.
 *
 * @param {IssueOrPullRequest} issueOrPullRequest Issue or pull request to check.
 * @param {Options} options Configuration options.
 * @returns {Boolean}
 */
module.exports = function isIssueOrPullRequestToUnstale( issueOrPullRequest, options ) {
	const staleDate = findStaleDate( issueOrPullRequest, options );

	return isIssueOrPullRequestActive( issueOrPullRequest, staleDate, options );
};
