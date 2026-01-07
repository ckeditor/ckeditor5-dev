/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { subDays, formatISO } from 'date-fns';

/**
 * Converts configuration options into format required by the GitHubRepository.
 *
 * @param {string} viewerLogin The GitHub login of the currently authenticated user.
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
 * @typedef {object} Config
 * @property {string} GITHUB_TOKEN
 * @property {string} REPOSITORY_SLUG
 * @property {Array.<string>} STALE_LABELS
 * @property {string} STALE_ISSUE_MESSAGE
 * @property {string} STALE_PR_MESSAGE
 * @property {Array.<string>} CLOSE_ISSUE_LABELS
 * @property {string} CLOSE_ISSUE_MESSAGE
 * @property {Array.<string>} CLOSE_PR_LABELS
 * @property {string} CLOSE_PR_MESSAGE
 * @property {string} [STALE_PENDING_ISSUE_MESSAGE=STALE_ISSUE_MESSAGE]
 * @property {Array.<string>} [PENDING_ISSUE_LABELS=[]]
 * @property {number} [DAYS_BEFORE_STALE=365]
 * @property {number} [DAYS_BEFORE_STALE_PENDING_ISSUE=14]
 * @property {number} [DAYS_BEFORE_CLOSE=30]
 * @property {boolean} [IGNORE_VIEWER_ACTIVITY=true]
 * @property {Array.<string>} [IGNORED_ISSUE_LABELS=[]]
 * @property {Array.<string>} [IGNORED_PR_LABELS=[]]
 * @property {Array.<string>} [IGNORED_ACTIVITY_LABELS=[]]
 * @property {Array.<string>} [IGNORED_ACTIVITY_LOGINS=[]]
 */

/**
 * @typedef {object} Options
 * @property {string} repositorySlug
 * @property {string} staleDate
 * @property {string} staleDatePendingIssue
 * @property {string} closeDate
 * @property {Array.<string>} staleLabels
 * @property {boolean} shouldProcessPendingIssues
 * @property {Array.<string>} pendingIssueLabels
 * @property {string} staleIssueMessage
 * @property {string} stalePendingIssueMessage
 * @property {string} stalePullRequestMessage
 * @property {Array.<string>} closeIssueLabels
 * @property {string} closeIssueMessage
 * @property {Array.<string>} closePullRequestLabels
 * @property {string} closePullRequestMessage
 * @property {Array.<string>} ignoredIssueLabels
 * @property {Array.<string>} ignoredPullRequestLabels
 * @property {Array.<string>} ignoredActivityLabels
 * @property {Array.<string>} ignoredActivityLogins
 */
