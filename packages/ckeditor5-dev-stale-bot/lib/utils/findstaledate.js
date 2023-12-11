/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const { isAfter, parseISO } = require( 'date-fns' );

/**
 * Finds the most recent event date, when any of the stale labels was assigned to the stale issue or pull request.
 *
 * @param {IssueOrPullRequest} issueOrPullRequest Issue or pull request to check.
 * @param {Options} options Configuration options.
 * @returns {String}
 */
module.exports = function findStaleDate( issueOrPullRequest, options ) {
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
};
