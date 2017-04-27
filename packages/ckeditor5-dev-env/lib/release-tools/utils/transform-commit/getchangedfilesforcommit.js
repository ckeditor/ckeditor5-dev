/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );

/**
 * Returns an array with paths to changed files for given commit.
 *
 * @param {String} commitId
 * @returns {Array.<String>}
 */
module.exports = function getChangedFilesForCommit( commitId ) {
	const gitCommand = `git log -m -1 --name-only --pretty="format:" ${ commitId }`;
	const changedFiles = tools.shExec( gitCommand, { verbosity: 'error' } ).trim();

	if ( !changedFiles ) {
		return [];
	}

	return changedFiles.split( '\n' );
};
