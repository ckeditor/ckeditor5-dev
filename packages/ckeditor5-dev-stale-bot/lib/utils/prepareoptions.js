/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const { subDays, formatISO } = require( 'date-fns' );

/**
 * A GitHub client containing methods used to fetch data from GitHub using GraphQL API.
 *
 * It handles paginated data and it supports a case when a request has exceeded the GitHub API rate limit.
 * In such a case, the request waits until the limit is reset and it is automatically sent again.
 */
module.exports = function prepareOptions( viewerLogin, type, config ) {
	const {
		REPOSITORY_SLUG,
		DAYS_BEFORE_STALE = 365,
		IGNORE_VIEWER_ACTIVITY = true,
		IGNORED_ISSUE_LABELS = [],
		IGNORED_PR_LABELS = [],
		IGNORED_ACTIVITY_LOGINS = [],
		IGNORED_ACTIVITY_LABELS = []
	} = config;

	return {
		type,
		repositorySlug: REPOSITORY_SLUG,
		dateBeforeStale: formatISO( subDays( new Date(), DAYS_BEFORE_STALE ), { representation: 'date' } ),
		ignoredLabels: type === 'issue' ? IGNORED_ISSUE_LABELS : IGNORED_PR_LABELS,
		ignoredActivityLogins: IGNORE_VIEWER_ACTIVITY ?
			[ ...IGNORED_ACTIVITY_LOGINS, viewerLogin ] :
			IGNORED_ACTIVITY_LOGINS,
		ignoredActivityLabels: IGNORED_ACTIVITY_LABELS
	};
};
