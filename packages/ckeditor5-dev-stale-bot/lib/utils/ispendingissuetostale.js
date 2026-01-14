/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { isBefore, parseISO } from 'date-fns';
import isPendingIssueStale from './ispendingissuestale.js';

/**
 * Checks whether pending issue should be staled, because it was not answered by a community member since the defined moment of time.
 *
 * @param {PendingIssue} pendingIssue Pending issue to check.
 * @param {Options} options Configuration options.
 * @returns {boolean}
 */
export default function isPendingIssueToStale( pendingIssue, options ) {
	const { lastComment } = pendingIssue;
	const { staleDatePendingIssue } = options;

	if ( isPendingIssueStale( pendingIssue, options ) ) {
		return false;
	}

	if ( !lastComment ) {
		return false;
	}

	if ( lastComment.isExternal ) {
		return false;
	}

	return isBefore( parseISO( lastComment.createdAt ), parseISO( staleDatePendingIssue ) );
}
