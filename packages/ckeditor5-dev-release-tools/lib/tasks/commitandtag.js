/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
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
 * @param {boolean} [options.skipCi=true] Whether to add the "[skip ci]" suffix to the commit message.
 * @param {boolean} [options.dryRun=false] In order to run pre commit checks in a dry run mode.
 * @param {ListrTaskObject} [options.listrTask={}] An instance of `ListrTask`.
 * @returns {Promise}
 */
export default async function commitAndTag( {
	version,
	files,
	cwd = process.cwd(),
	skipCi = true,
	dryRun = false,
	listrTask = {}
} ) {
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

	if ( dryRun ) {
		await executePreCommitHook( { filePathsToAdd, cwd } );
		listrTask.output = `[dry run] Creating git tag v${ tagForVersion }.`;
	} else {
		await git.commit( `Release: v${ version }.${ skipCi ? ' [skip ci]' : '' }`, filePathsToAdd );
		await git.addTag( `v${ version }` );
	}
}

/**
 * Function that imitates running dry run for the `git commit` command.
 *
 * @param {object} options
 * @param {Array.<string>} options.filePathsToAdd File paths to run the dry run validations for.
 * @param {string} options.cwd Current working directory from which all paths will be resolved.
 * @returns {Promise<void>}
 */
async function executePreCommitHook( { filePathsToAdd, cwd } ) {
	const normalizedCwd = toUnix( cwd );
	const git = simpleGit( { baseDir: normalizedCwd } );

	try {
		const preDryRunCommit = await git.log( [ '-1' ] );
		await git.commit( '[dry run] Release.', filePathsToAdd );

		try {
			await git.reset( [ preDryRunCommit.latest.hash ] );
		} catch {
			throw new Error(
				'Running `git reset` failed during `git commit` dry run. The release might be in a broken state. ' +
				'Either fix it manually or prepare the release again.'
			);
		}
	} catch ( error ) {
		throw error.message;
	}
}
