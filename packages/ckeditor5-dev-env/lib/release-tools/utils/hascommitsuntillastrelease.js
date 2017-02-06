/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );

/**
 * Checks whether the package has committed changes until the last tag.
 * If the last tag does not exist, the function checks whether any commit exists.
 *
 * @returns {Boolean}
 */
module.exports = function hasCommitsUntilLastRelease() {
	const shExecParams = { verbosity: 'error' };
	let commitsNumber;

	const tagsList = tools.shExec( 'git tag --list', shExecParams ).trim();

	if ( tagsList.length ) {
		commitsNumber = tools.shExec( 'git log `git describe --tags --abbrev=0`..HEAD --oneline | wc -l', shExecParams );
	} else {
		// Won't throw an error if repository does not have any commit.
		commitsNumber = tools.shExec( 'git log --oneline 2&> /dev/null | wc -l', shExecParams );
	}

	return parseInt( commitsNumber.trim() ) > 0;
};
