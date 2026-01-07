/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * Creates a query to search for issues or pull requests.
 *
 * @param {object} options
 * @param {string} options.repositorySlug
 * @param {string} [options.searchDate]
 * @param {'Issue'|'PullRequest'} [options.type]
 * @param {Array.<string>} [options.labels=[]]
 * @param {Array.<string>} [options.ignoredLabels=[]]
 * @returns {string}
 */
export default function prepareSearchQuery( options ) {
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
		searchDate ? `created:<${ searchDate }` : '',
		resourceType ? `type:${ resourceType }` : '',
		'state:open',
		'sort:created-desc',
		...labels.map( label => `label:${ label }` ),
		...ignoredLabels.map( label => `-label:${ label }` )
	].filter( Boolean ).join( ' ' );
}

function mapGitHubResourceType( type ) {
	const resourceMap = {
		'Issue': 'issue',
		'PullRequest': 'pr'
	};

	return resourceMap[ type ];
}
