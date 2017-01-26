/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );

/**
 * Returns a name of last created tag. If any tag does not exist, returns null.
 *
 * @returns {String|null}
 */
module.exports = function getLastCreatedTag() {
	const shExecParams = { verbosity: 'error' };

	// All tags.
	const tagList = tools.shExec( 'git tag --list', shExecParams ).trim();

	if ( tagList ) {
		// Return the last one.
		return tools.shExec( 'git describe --tags `git rev-list --tags --max-count=1`', shExecParams ).trim();
	}

	return null;
};
