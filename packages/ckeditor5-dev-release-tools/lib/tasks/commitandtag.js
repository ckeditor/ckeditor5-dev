/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { shExec } = require( '@ckeditor/ckeditor5-dev-utils/lib/tools' );
const { toUnix } = require( 'upath' );
const { globSync } = require( 'glob' );

/**
 * Creates a commit and a tag for specified version.
 *
 * @param {Object} options
 * @param {String} options.version The commit will contain this param in its message and the tag will have a `v` prefix.
 * @param {Array.<String>} options.files Array of glob patterns for files to be added to the release commit.
 * @param {String} [options.cwd=process.cwd()] Current working directory from which all paths will be resolved.
 */
module.exports = function commitAndTag( { version, files, cwd = process.cwd() } ) {
	const normalizedCwd = toUnix( cwd );
	const filePathsToAdd = globSync( files, { cwd: normalizedCwd, absolute: true, nodir: true } );
	const filePathsToAddStr = filePathsToAdd.join( ' ' );

	shExec( `git add ${ filePathsToAddStr }`, { cwd: normalizedCwd } );
	shExec( `git commit --message "Release: v${ version }."`, { cwd: normalizedCwd } );
	shExec( `git tag v${ version }`, { cwd: normalizedCwd } );
};
