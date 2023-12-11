/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const { isAfter, parseISO } = require( 'date-fns' );
const isIssueOrPullRequestActive = require( './isissueorpullrequestactive' );
const findStaleDate = require( './findstaledate' );

/**
 * Checks whether the time to close a stale issue or pull request has passed and whether it is still inactive.
 *
 * @param {IssueOrPullRequest} issueOrPullRequest Issue or pull request to check.
 * @param {Options} options Configuration options.
 * @returns {Boolean}
 */
module.exports = function isIssueOrPullRequestToClose( issueOrPullRequest, options ) {
	const staleDate = findStaleDate( issueOrPullRequest, options );
	const hasTimeToClosePassed = isAfter( parseISO( options.closeDate ), parseISO( staleDate ) );

	if ( !hasTimeToClosePassed ) {
		return false;
	}

	return !isIssueOrPullRequestActive( issueOrPullRequest, staleDate, options );
};
