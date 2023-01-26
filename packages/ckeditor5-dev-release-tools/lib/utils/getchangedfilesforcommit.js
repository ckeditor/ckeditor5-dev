/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
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

	// Merge commits can have two parents. Returned files for merge commits looks like:
	// file1            <-- files from merged branch
	// file2            <-- files from merged branch
	// file             <-- files from merged branch
	//
	// other-file1      <-- files from last commit before merge
	// other-file2      <-- files from last commit before merge
	// We need to filter out files from commit before merge.

	return changedFiles.split( '\n\n' )[ 0 ]
		.split( '\n' )
		.map( file => file.trim() )
		.filter( item => item );
};
