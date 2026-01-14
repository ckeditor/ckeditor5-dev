/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { isAfter, parseISO } from 'date-fns';

/**
 * Finds the most recent event date of the stale label assignment to issue or pull request.
 *
 * @param {IssueOrPullRequest} issueOrPullRequest Issue or pull request to check.
 * @param {Options} options Configuration options.
 * @returns {string}
 */
export default function findStaleDate( issueOrPullRequest, options ) {
	const { staleLabels } = options;

	return issueOrPullRequest.timelineItems
		.filter( entry => entry.label )
		.sort( ( entryA, entryB ) => {
			return isAfter(
				parseISO( entryA.eventDate ),
				parseISO( entryB.eventDate )
			) ? -1 : 1;
		} )
		.find( entry => staleLabels.includes( entry.label ) )
		.eventDate;
}
