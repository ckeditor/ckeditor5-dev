/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { isAfter, parseISO } from 'date-fns';
import isIssueOrPullRequestActive from './isissueorpullrequestactive.js';
import findStaleDate from './findstaledate.js';

/**
 * Checks whether the time to close a stale issue or pull request has passed and whether it is still inactive.
 *
 * @param {IssueOrPullRequest} issueOrPullRequest Issue or pull request to check.
 * @param {Options} options Configuration options.
 * @returns {boolean}
 */
export default function isIssueOrPullRequestToClose( issueOrPullRequest, options ) {
	const staleDate = findStaleDate( issueOrPullRequest, options );
	const hasTimeToClosePassed = isAfter( parseISO( options.closeDate ), parseISO( staleDate ) );

	if ( !hasTimeToClosePassed ) {
		return false;
	}

	return !isIssueOrPullRequestActive( issueOrPullRequest, staleDate, options );
}
