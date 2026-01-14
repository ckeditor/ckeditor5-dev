/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * Checks whether pending issue is already stale.
 *
 * @param {PendingIssue} pendingIssue Pending issue to check.
 * @param {Options} options Configuration options.
 * @returns {boolean}
 */
export default function isPendingIssueStale( pendingIssue, options ) {
	return options.staleLabels.every( staleLabel => pendingIssue.labels.includes( staleLabel ) );
}
