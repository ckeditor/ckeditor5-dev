/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { simpleGit } from 'simple-git';

/**
 * Push the local changes to a remote server.
 *
 * @param {object} options
 * @param {string} options.releaseBranch A name of the branch that should be used for releasing packages.
 * @param {string} options.version Name of tag connected with the release.
 * @param {string} [options.cwd] Root of the repository to prepare. `process.cwd()` by default.
 * @returns {Promise}
 */
export default async function push( options ) {
	const {
		releaseBranch,
		version,
		cwd = process.cwd()
	} = options;

	const git = simpleGit( { baseDir: cwd } );
	const remote = 'origin';
	const tag = `v${ version }`;

	await git.push( remote, releaseBranch );
	await git.raw( 'push', remote, tag );
}
