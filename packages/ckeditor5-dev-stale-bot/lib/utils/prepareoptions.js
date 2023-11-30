/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const { subDays, formatISO } = require( 'date-fns' );

/**
 * Converts configuration options into format required by the GitHubRepository.
 *
 * @param {String} viewerLogin The GitHub login of the currently authenticated user.
 * @param {'issue'|'pr'} type Type of GitHub resource.
 * @param {Config} config Configuration options.
 * @returns {Options} Converted options.
 */
module.exports = function prepareOptions( viewerLogin, type, config ) {
	const {
		REPOSITORY_SLUG,
		DAYS_BEFORE_STALE = 365,
		IGNORE_VIEWER_ACTIVITY = true,
		IGNORED_ISSUE_LABELS = [],
		IGNORED_PR_LABELS = [],
		IGNORED_ACTIVITY_LABELS = [],
		IGNORED_ACTIVITY_LOGINS = []
	} = config;

	const staleDate = formatISO(
		subDays( new Date(), DAYS_BEFORE_STALE ),
		{ representation: 'date' }
	);

	return {
		type,
		repositorySlug: REPOSITORY_SLUG,
		staleDate,
		searchDate: staleDate,
		ignoredLabels: type === 'issue' ?
			IGNORED_ISSUE_LABELS :
			IGNORED_PR_LABELS,
		ignoredActivityLabels: IGNORED_ACTIVITY_LABELS,
		ignoredActivityLogins: IGNORE_VIEWER_ACTIVITY ?
			[ ...IGNORED_ACTIVITY_LOGINS, viewerLogin ] :
			IGNORED_ACTIVITY_LOGINS
	};
};

/**
 * @typedef {Object} Config
 * @property {String} REPOSITORY_SLUG
 * @property {Number} [DAYS_BEFORE_STALE=365]
 * @property {Boolean} [IGNORE_VIEWER_ACTIVITY=true]
 * @property {Array.<String>} [IGNORED_ISSUE_LABELS=[]]
 * @property {Array.<String>} [IGNORED_PR_LABELS=[]]
 * @property {Array.<String>} [IGNORED_ACTIVITY_LABELS=[]]
 * @property {Array.<String>} [IGNORED_ACTIVITY_LOGINS=[]]
 */

/**
 * @typedef {Object} Options
 * @property {String} type
 * @property {String} repositorySlug
 * @property {String} staleDate
 * @property {String} searchDate
 * @property {Array.<String>} ignoredLabels
 * @property {Array.<String>} ignoredActivityLabels
 * @property {Array.<String>} ignoredActivityLogins
 */
