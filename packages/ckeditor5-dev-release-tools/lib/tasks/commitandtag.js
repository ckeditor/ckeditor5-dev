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
 * @returns {Promise}
 */
export default async function commitAndTag( {
	version,
	files,
	cwd = process.cwd(),
	skipCi = true,
	dryRun = false
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

	const makeCommit = () => {
		return git.commit( `Release: v${ version }.${ skipCi ? ' [skip ci]' : '' }`, filePathsToAdd );
	};

	if ( dryRun ) {
		try {
			const lastCommit = await git.log( [ '-1' ] );

			await makeCommit();
			await git.reset( [ lastCommit.latest.hash ] );
		} catch ( error ) {
			console.log( error );
			throw error.message;
		}
	} else if ( !tagForVersion ) {
		// Commit and create a tag if it does not exist yet. It might happen when a release job is restarted.
		await makeCommit();
		await git.addTag( `v${ version }` );
	}
}
