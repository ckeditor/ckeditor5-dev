/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { subDays, formatISO } from 'date-fns';

/**
 * Converts configuration options into format required by the GitHubRepository.
 *
 * @param {String} viewerLogin The GitHub login of the currently authenticated user.
 * @param {Config} config Configuration options.
 * @returns {Options}
 */
export default function parseConfig( viewerLogin, config ) {
	const {
		REPOSITORY_SLUG,
		STALE_LABELS,
		STALE_ISSUE_MESSAGE,
		STALE_PR_MESSAGE,
		CLOSE_ISSUE_LABELS,
		CLOSE_ISSUE_MESSAGE,
		CLOSE_PR_LABELS,
		CLOSE_PR_MESSAGE,
		STALE_PENDING_ISSUE_MESSAGE = STALE_ISSUE_MESSAGE,
		PENDING_ISSUE_LABELS = [],
		DAYS_BEFORE_STALE = 365,
		DAYS_BEFORE_STALE_PENDING_ISSUE = 14,
		DAYS_BEFORE_CLOSE = 30,
		IGNORE_VIEWER_ACTIVITY = true,
		IGNORED_ISSUE_LABELS = [],
		IGNORED_PR_LABELS = [],
		IGNORED_ACTIVITY_LABELS = [],
		IGNORED_ACTIVITY_LOGINS = []
	} = config;

	const now = new Date();
	const staleDate = formatISO( subDays( now, DAYS_BEFORE_STALE ) );
	const staleDatePendingIssue = formatISO( subDays( now, DAYS_BEFORE_STALE_PENDING_ISSUE ) );
	const closeDate = formatISO( subDays( now, DAYS_BEFORE_CLOSE ) );

	return {
		repositorySlug: REPOSITORY_SLUG,
		staleDate,
		staleDatePendingIssue,
		closeDate,
		staleLabels: STALE_LABELS,
		shouldProcessPendingIssues: PENDING_ISSUE_LABELS.length > 0,
		pendingIssueLabels: PENDING_ISSUE_LABELS,
		staleIssueMessage: STALE_ISSUE_MESSAGE,
		stalePendingIssueMessage: STALE_PENDING_ISSUE_MESSAGE,
		stalePullRequestMessage: STALE_PR_MESSAGE,
		closeIssueLabels: CLOSE_ISSUE_LABELS,
		closeIssueMessage: CLOSE_ISSUE_MESSAGE,
		closePullRequestLabels: CLOSE_PR_LABELS,
		closePullRequestMessage: CLOSE_PR_MESSAGE,
		ignoredIssueLabels: IGNORED_ISSUE_LABELS,
		ignoredPullRequestLabels: IGNORED_PR_LABELS,
		ignoredActivityLabels: IGNORED_ACTIVITY_LABELS,
		ignoredActivityLogins: IGNORE_VIEWER_ACTIVITY ?
			[ ...IGNORED_ACTIVITY_LOGINS, viewerLogin ] :
			IGNORED_ACTIVITY_LOGINS
	};
}

/**
 * @typedef {Object} Config
 * @property {String} GITHUB_TOKEN
 * @property {String} REPOSITORY_SLUG
 * @property {Array.<String>} STALE_LABELS
 * @property {String} STALE_ISSUE_MESSAGE
 * @property {String} STALE_PR_MESSAGE
 * @property {Array.<String>} CLOSE_ISSUE_LABELS
 * @property {String} CLOSE_ISSUE_MESSAGE
 * @property {Array.<String>} CLOSE_PR_LABELS
 * @property {String} CLOSE_PR_MESSAGE
 * @property {String} [STALE_PENDING_ISSUE_MESSAGE=STALE_ISSUE_MESSAGE]
 * @property {Array.<String>} [PENDING_ISSUE_LABELS=[]]
 * @property {Number} [DAYS_BEFORE_STALE=365]
 * @property {Number} [DAYS_BEFORE_STALE_PENDING_ISSUE=14]
 * @property {Number} [DAYS_BEFORE_CLOSE=30]
 * @property {Boolean} [IGNORE_VIEWER_ACTIVITY=true]
 * @property {Array.<String>} [IGNORED_ISSUE_LABELS=[]]
 * @property {Array.<String>} [IGNORED_PR_LABELS=[]]
 * @property {Array.<String>} [IGNORED_ACTIVITY_LABELS=[]]
 * @property {Array.<String>} [IGNORED_ACTIVITY_LOGINS=[]]
 */

/**
 * @typedef {Object} Options
 * @property {String} repositorySlug
 * @property {String} staleDate
 * @property {String} staleDatePendingIssue
 * @property {String} closeDate
 * @property {Array.<String>} staleLabels
 * @property {Boolean} shouldProcessPendingIssues
 * @property {Array.<String>} pendingIssueLabels
 * @property {String} staleIssueMessage
 * @property {String} stalePendingIssueMessage
 * @property {String} stalePullRequestMessage
 * @property {Array.<String>} closeIssueLabels
 * @property {String} closeIssueMessage
 * @property {Array.<String>} closePullRequestLabels
 * @property {String} closePullRequestMessage
 * @property {Array.<String>} ignoredIssueLabels
 * @property {Array.<String>} ignoredPullRequestLabels
 * @property {Array.<String>} ignoredActivityLabels
 * @property {Array.<String>} ignoredActivityLogins
 */
