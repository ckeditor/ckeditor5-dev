/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import upath from 'upath';
import { glob } from 'glob';
import { simpleGit } from 'simple-git';

const { toUnix } = upath;

/**
 * Creates a commit and a tag for specified version.
 *
 * @param {object} options
 * @param {string} options.version The commit will contain this param in its message and the tag will have a `v` prefix.
 * @param {Array.<string>} options.files Array of glob patterns for files to be added to the release commit.
 * @param {string} [options.cwd=process.cwd()] Current working directory from which all paths will be resolved.
 * @param {boolean} [options.skipCi=true] Whether to add [skip ci] to the commit.
 * @returns {Promise}
 */
export default async function commitAndTag( { version, files, cwd = process.cwd(), skipCi = true } ) {
	const normalizedCwd = toUnix( cwd );
	const filePathsToAdd = await glob( files, { cwd: normalizedCwd, absolute: true, nodir: true } );

	if ( !filePathsToAdd.length ) {
		return;
	}

	const git = simpleGit( {
		baseDir: normalizedCwd
	} );

	const { all: availableTags } = await git.tags();
	const tagForVersion = availableTags.find( tag => tag.endsWith( version ) );

	// Do not commit and create tags if a tag is already taken. It might happen when a release job is restarted.
	if ( tagForVersion ) {
		return;
	}

	await git.commit( `Release: v${ version }.${ skipCi ? ' [skip ci]' : '' }`, filePathsToAdd );
	await git.addTag( `v${ version }` );
}
