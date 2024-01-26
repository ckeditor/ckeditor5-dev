/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/**
 * Checks whether pending issue is already stale.
 *
 * @param {PendingIssue} pendingIssue Pending issue to check.
 * @param {Options} options Configuration options.
 * @returns {Boolean}
 */
module.exports = function isPendingIssueStale( pendingIssue, options ) {
	return options.staleLabels.every( staleLabel => pendingIssue.labels.includes( staleLabel ) );
};
