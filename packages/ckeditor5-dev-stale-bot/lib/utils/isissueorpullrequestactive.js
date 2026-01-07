/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { isAfter, parseISO } from 'date-fns';

/**
 * Verifies dates from an issue or pull request to check if some of them occurred after the provided moment, meaning that the issue or pull
 * request is active.
 *
 * The dates taken into account are:
 * * the creation date,
 * * the last date of editing an issue or pull request,
 * * the last date of adding a reaction to the body of issue or pull request,
 * * the last date of adding or editing a comment,
 * * the last date of changing a label.
 *
 * Some activity entries may be ignored and not used in the calculation, if so specified in the configuration (e.g. the author of an event).
 *
 * @param {IssueOrPullRequest} issueOrPullRequest Issue or pull request to check.
 * @param {string} staleDate Date specifying the moment of checking the activity in the issue or pull request.
 * @param {Options} options Configuration options.
 * @returns {boolean}
 */
export default function isIssueOrPullRequestActive( issueOrPullRequest, staleDate, options ) {
	const { ignoredActivityLogins, ignoredActivityLabels } = options;

	const dates = [
		issueOrPullRequest.createdAt,
		issueOrPullRequest.lastEditedAt,
		issueOrPullRequest.lastReactedAt,
		...issueOrPullRequest.timelineItems
			.filter( entry => {
				if ( !entry.author ) {
					return true;
				}

				return !ignoredActivityLogins.includes( entry.author );
			} )
			.filter( entry => {
				if ( !entry.label ) {
					return true;
				}

				return !ignoredActivityLabels.includes( entry.label );
			} )
			.map( entry => entry.eventDate )
	];

	return dates
		.filter( Boolean )
		.some( date => isAfter( parseISO( date ), parseISO( staleDate ) ) );
}
