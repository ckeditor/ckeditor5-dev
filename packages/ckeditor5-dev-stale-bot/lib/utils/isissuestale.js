/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const { isBefore, parseISO } = require( 'date-fns' );

/**
 * Verifies the last activity dates from an issue to check if they all have occured before the moment defining the stale issue.
 *
 * The dates taken into account are:
 * - the moment of issue creation,
 * - the moment of the last edition of issue,
 * - the moment of adding or editing a comment,
 * - the moment of adding last reaction to issue,
 * - the moment of changing a label.
 *
 * Some activity entries may be ignored and not used in the calculation, if so specified in the configuration (e.g. the author of an event).
 *
 * @param {Issue} issue Issue to check.
 * @param {Options} options Configuration options.
 * @returns {Boolean} Returns `true` if issue is considered as stale, or `false` otherwise.
 */
module.exports = function isIssueStale( issue, options ) {
	const { staleDate, ignoredActivityLogins, ignoredActivityLabels } = options;

	const dates = [
		issue.createdAt,
		issue.lastEditedAt,
		issue.lastReactedAt,
		...issue.timelineItems
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
		.every( date => isBefore( parseISO( date ), parseISO( staleDate ) ) );
};
