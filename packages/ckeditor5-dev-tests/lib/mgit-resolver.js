/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const parseRepositoryUrl = require( 'mgit2/lib/utils/parserepositoryurl' );

/**
 * Resolves repository URL for a given package name.
 *
 * @param {String} packageName Package name.
 * @param {Options} data.options The options object.
 * @returns {Repository|null}
 */
module.exports = function resolver( packageName, options ) {
	let repositoryUrl = options.dependencies[ packageName ];

	if ( !repositoryUrl ) {
		if ( packageName.match( /^@ckeditor\/ckeditor5-(?!dev)/ ) ) {
			repositoryUrl = packageName.slice( 1 );
		} else {
			return null;
		}
	}

	const repository = parseRepositoryUrl( repositoryUrl, {
		urlTemplate: 'https://github.com/${ path }.git',
		defaultBranch: options.resolverDefaultBranch
	} );

	return repository;
};
