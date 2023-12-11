/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/**
 * Creates a query to search for issues or pull requests.
 *
 * @param {Object} options
 * @param {String} options.repositorySlug
 * @param {String} options.searchDate
 * @param {'Issue'|'PullRequest'} [options.type]
 * @param {Array.<String>} [options.labels=[]]
 * @param {Array.<String>} [options.ignoredLabels=[]]
 * @returns {String}
 */
module.exports = function prepareSearchQuery( options ) {
	const {
		repositorySlug,
		searchDate,
		type,
		labels = [],
		ignoredLabels = []
	} = options;

	const resourceType = mapGitHubResourceType( type );

	return [
		`repo:${ repositorySlug }`,
		`created:<${ searchDate }`,
		resourceType ? `type:${ resourceType }` : '',
		'state:open',
		'sort:created-desc',
		...labels.map( label => `label:${ label }` ),
		...ignoredLabels.map( label => `-label:${ label }` )
	].filter( Boolean ).join( ' ' );
};

function mapGitHubResourceType( type ) {
	const resourceMap = {
		'Issue': 'issue',
		'PullRequest': 'pr'
	};

	return resourceMap[ type ];
}
