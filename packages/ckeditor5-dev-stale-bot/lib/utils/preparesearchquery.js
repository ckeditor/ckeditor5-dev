/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/**
 * Creates a query to search for issues or pull requests that potentially could be considered as stale ones.
 *
 * @param {SearchOptions} options Configuration options.
 * @returns {String} Search query to sent to GitHub.
 */
module.exports = function prepareSearchQuery( options ) {
	const {
		type,
		searchDate,
		repositorySlug,
		ignoredLabels = []
	} = options;

	return [
		`repo:${ repositorySlug }`,
		`created:<${ searchDate }`,
		`type:${ type }`,
		'state:open',
		'sort:created-desc',
		...ignoredLabels.map( label => `-label:${ label }` )
	].join( ' ' );
};
