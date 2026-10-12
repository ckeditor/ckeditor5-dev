/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import upath from 'upath';
import { vi } from 'vitest';
import { createTempDirectory, writeFiles } from './files.js';

/**
 * Makes git ignore the configuration of the machine (for example, commit signing). Call it in `beforeEach()`,
 * because environment stubs are reset after every test.
 */
export async function isolateGit(): Promise<void> {
	const configPath = upath.join( await createTempDirectory(), 'gitconfig' );

	await writeFile( configPath, '' );

	vi.stubEnv( 'GIT_CONFIG_GLOBAL', configPath );
	vi.stubEnv( 'GIT_CONFIG_NOSYSTEM', '1' );
}

export function git( cwd: string, ...args: Array<string> ): string {
	return execFileSync( 'git', [ '-c', 'user.name=Test', '-c', 'user.email=test@example.com', '-c', 'commit.gpgsign=false', ...args ], {
		cwd,
		encoding: 'utf8',
		stdio: [ 'ignore', 'pipe', 'pipe' ]
	} );
}

/**
 * Creates a repository with the files committed on the `stable` branch.
 */
export async function createRepository( files: Record<string, string>, path?: string ): Promise<string> {
	const root = path ?? await createTempDirectory();

	git( root, 'init', '--quiet', '--initial-branch=stable' );
	await writeFiles( root, files );
	git( root, 'add', '--all' );
	git( root, 'commit', '--quiet', '--message', 'Initial commit.' );

	return root;
}

/**
 * Creates a bare repository with the files on the `stable` branch, and a clone to push more commits from.
 */
export async function createRemote( files: Record<string, string> ): Promise<{ remote: string; seed: string }> {
	const base = await createTempDirectory();
	const remote = upath.join( base, 'remote.git' );
	const seed = upath.join( base, 'seed' );

	git( base, 'init', '--quiet', '--bare', '--initial-branch=stable', remote );
	git( base, 'clone', '--quiet', remote, seed );
	git( seed, 'checkout', '--quiet', '-b', 'stable' );
	await writeFiles( seed, files );
	git( seed, 'add', '--all' );
	git( seed, 'commit', '--quiet', '--message', 'Initial commit.' );
	git( seed, 'push', '--quiet', 'origin', 'HEAD:stable' );

	return { remote, seed };
}

/**
 * Commits the files in the clone and pushes them to the branch of the remote.
 */
export async function pushFiles( seed: string, files: Record<string, string>, branch = 'stable' ): Promise<void> {
	await writeFiles( seed, files );
	git( seed, 'add', '--all' );
	git( seed, 'commit', '--quiet', '--message', 'More changes.' );
	git( seed, 'push', '--quiet', 'origin', `HEAD:${ branch }` );
}

/**
 * Clones the remote into a new temporary directory, the way CI prepares a checkout. The base branch is checked out.
 */
export async function createCheckout( remote: string, ...cloneArguments: Array<string> ): Promise<string> {
	const path = upath.join( await createTempDirectory(), 'checkout' );

	git( upath.dirname( path ), 'clone', '--quiet', ...cloneArguments, remote, path );

	return path;
}
