/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { isBefore, parseISO } = require( 'date-fns' );
const isPendingIssueStale = require( './ispendingissuestale' );

/**
 * Checks whether pending issue should be staled, because it was not answered by a community member since the defined moment of time.
 *
 * @param {PendingIssue} pendingIssue Pending issue to check.
 * @param {Options} options Configuration options.
 * @returns {Boolean}
 */
module.exports = function isPendingIssueToStale( pendingIssue, options ) {
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
};
