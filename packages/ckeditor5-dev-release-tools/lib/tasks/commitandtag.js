/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import upath from 'upath';
import { glob } from 'glob';
import { simpleGit } from 'simple-git';
import { git } from '@ckeditor/ckeditor5-dev-utils';

/**
 * Creates a commit and a tag for the specified version.
 *
 * @param {object} options
 * @param {string} options.version The commit will contain this param in its message and the tag will have a `v` prefix.
 * @param {Array.<string>} options.files Array of glob patterns for files to be added to the release commit.
 * @param {string} [options.cwd=process.cwd()] Current working directory from which all paths will be resolved.
 * @param {boolean} [options.skipCi=true] Whether to add the "[skip ci]" suffix to the commit message.
 * @param {boolean} [options.dryRun=false] When enabled, the function creates a commit to allow executing a pre-commit hook,
 * then removes it using the `git reset` command.
 * @returns {Promise}
 */
export default async function commitAndTag( {
	version,
	files,
	cwd = process.cwd(),
	skipCi = true,
	dryRun = false
} ) {
	const normalizedCwd = upath.toUnix( cwd );
	const filePathsToAdd = await glob( files, { cwd: normalizedCwd, absolute: true, nodir: true } );

	if ( !filePathsToAdd.length ) {
		return;
	}

	const message = `Release: v${ version }.${ skipCi ? ' [skip ci]' : '' }`;

	if ( dryRun ) {
		return git.commit( {
			cwd: normalizedCwd,
			message,
			dryRun: true,
			files: filePathsToAdd
		} );
	}

	const gitInstance = simpleGit( {
		baseDir: normalizedCwd
	} );

	const { all: availableTags } = await gitInstance.tags();
	const tagForVersion = availableTags.find( tag => tag.endsWith( version ) );

	// Commit and create a tag if it does not exist yet. It might happen when a release job is restarted.
	if ( !tagForVersion ) {
		await git.commit( {
			cwd: normalizedCwd,
			message,
			files: filePathsToAdd
		} );
		await gitInstance.addAnnotatedTag( `v${ version }`, `Release: v${ version }.` );
	}
}
