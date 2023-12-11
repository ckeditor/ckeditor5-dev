/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const { isAfter, parseISO } = require( 'date-fns' );

/**
 * Verifies dates from an issue or pull request to check if some of them occured after the provided moment, meaning that the issue or pull
 * request is active.
 *
 * The dates taken into account are:
 * - the moment of creation,
 * - the moment of the last edit of the issue or pull request,
 * - the moment of adding or editing a comment,
 * - the moment of adding last reaction to the issue or pull request,
 * - the moment of changing a label.
 *
 * Some activity entries may be ignored and not used in the calculation, if so specified in the configuration (e.g. the author of an event).
 *
 * @param {IssueOrPullRequest} issueOrPullRequest Issue or pull request to check.
 * @param {String} staleDate Date specifying the moment of checking the activity in the issue or pull request.
 * @param {Options} options Configuration options.
 * @returns {Boolean}
 */
module.exports = function isIssueOrPullRequestActive( issueOrPullRequest, staleDate, options ) {
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
};
