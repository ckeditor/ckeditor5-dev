/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { tools } from '@ckeditor/ckeditor5-dev-utils';
import { toUnix } from 'upath';
import { glob } from 'glob';
import shellEscape from 'shell-escape';

/**
 * Creates a commit and a tag for specified version.
 *
 * @param {Object} options
 * @param {String} options.version The commit will contain this param in its message and the tag will have a `v` prefix.
 * @param {Array.<String>} options.files Array of glob patterns for files to be added to the release commit.
 * @param {String} [options.cwd=process.cwd()] Current working directory from which all paths will be resolved.
 * @returns {Promise}
 */
export async function commitAndTag( { version, files, cwd = process.cwd() } ) {
	const normalizedCwd = toUnix( cwd );
	const filePathsToAdd = await glob( files, { cwd: normalizedCwd, absolute: true, nodir: true } );

	if ( !filePathsToAdd.length ) {
		return;
	}

	const shExecOptions = {
		cwd: normalizedCwd,
		async: true,
		verbosity: 'silent'
	};

	// Run the command separately for each file to avoid exceeding the maximum command length on Windows, which is 32767 characters.
	for ( const filePath of filePathsToAdd ) {
		await tools.shExec( `git add ${ shellEscape( [ filePath ] ) }`, shExecOptions );
	}

	const escapedVersion = shellEscape( [ version ] );
	await tools.shExec( `git commit --message "Release: v${ escapedVersion }." --no-verify`, shExecOptions );
	await tools.shExec( `git tag v${ escapedVersion }`, shExecOptions );
}
