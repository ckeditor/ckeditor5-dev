/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const transformCommitForCKEditor5Package = require( './transformcommitforckeditor5package' );
const getChangedFilesFromCommit = require( './getchangedfilesfromcommit' );

/**
 * Parses a single commit for `ckeditor5-dev` package.
 *
 * @param {Commit} commit
 * @param {Object} {context}
 * @param {Boolean} context.displayLogs Whether to display the logs.
 * @param {Object} context.packageData Content from the 'package.json' for given package.
 * @returns {Commit}
 */
module.exports = function transformCommitForCKEditor5DevPackage( commit, context ) {
	const files = getChangedFilesFromCommit( commit.hash );

	if ( !files.length ) {
		return;
	}

	const packageName = context.packageData.name.split( '/' )[ 1 ];

	if ( !isValidCommit( files, packageName ) ) {
		return;
	}

	return transformCommitForCKEditor5Package( commit, context );
};

function isValidCommit( files, packageName ) {
	for ( const filePath of files ) {
		// Accept non-packages file (Gulpfile.js, .travis.yml, etc).
		if ( !filePath.match( /^packages\// ) ) {
			continue;
		}

		// Reject file which is not a part of current package.
		if ( !filePath.startsWith( `packages/${ packageName}` ) ) {
			return false;
		}
	}

	return true;
}
