/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * Checks whether pending issue should be unlabeled, because it was answered by a community member.
 *
 * @param {PendingIssue} pendingIssue Pending issue to check.
 * @returns {Boolean}
 */
export default function isPendingIssueToUnlabel( pendingIssue ) {
	if ( !pendingIssue.lastComment ) {
		return false;
	}

	return pendingIssue.lastComment.isExternal;
}
