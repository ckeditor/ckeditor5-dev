/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { execFile } from 'node:child_process';
import { cp, readFile, rm, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import upath from 'upath';
import { readIfExists } from '../utils/files.js';

// The largest output of a git command, in bytes. Listing every file of a big repository needs more than the default.
const MAX_GIT_OUTPUT_SIZE = 256 * 1024 * 1024;

/**
 * The state before a fix: `HEAD`, the whole working tree as a git tree, and the exact Git index, so staged changes
 * can be restored too.
 */
export type ChangeSnapshot = {
	head: string;
	tree: string;
	index: Buffer | null;
};

export type ChangeTracker = {
	capture(): Promise<ChangeSnapshot>;

	/**
	 * Inspects changes relative to the snapshot without modifying HEAD, the index or files.
	 */
	collect( snapshot: ChangeSnapshot ): Promise<{ changed: Array<string>; headMoved: boolean }>;

	/**
	 * Returns the given paths, `HEAD` and the index to their state in the snapshot. It undoes a fix with the snapshot
	 * from before it, and brings the fix back with a snapshot taken while it was applied.
	 */
	restore( snapshot: ChangeSnapshot, paths: Array<string> ): Promise<void>;
};

const execFileAsync = promisify( execFile );

/**
 * Tracks what `fix()` changes in a git working tree. It sees every file git sees: tracked files and untracked files
 * that are not ignored. The working tree may already have changes (the kept fixes of earlier units, or local changes
 * in a local run). Only what changes after a snapshot counts.
 *
 * A snapshot stores the working tree as a tree object, written through a copy of the index, so the real index
 * is never touched.
 */
export async function createChangeTracker( root: string ): Promise<ChangeTracker> {
	const top = upath.normalize( ( await git( root, [ 'rev-parse', '--show-toplevel' ] ) ).trim() );
	const indexPath = ( await git( top, [ 'rev-parse', '--path-format=absolute', '--git-path', 'index' ] ) ).trim();
	const snapshotIndexPath = `${ indexPath }.ckeditor5-dev-agents`;
	const snapshotIndex = { GIT_INDEX_FILE: snapshotIndexPath };

	// Without an index file, `write-tree` writes the empty tree.
	await rm( snapshotIndexPath, { force: true } );

	// Files are stored and restored byte for byte: no line ending conversion, and no filters or `eol` of attributes,
	// which are read from the empty tree and a missing file instead of the working tree and the user configuration.
	const rawContent = {
		args: [ '-c', 'core.autocrlf=false', '-c', `core.attributesFile=${ snapshotIndexPath }.attributes` ],
		env: { GIT_ATTR_SOURCE: ( await git( top, [ 'write-tree' ], snapshotIndex ) ).trim() }
	};

	const getHead = async () => ( await git( top, [ 'rev-parse', 'HEAD' ] ) ).trim();

	const writeTree = async () => {
		try {
			// The timestamps are kept, so git detects files changed in the same second as the index was written.
			await readIfExists( () => cp( indexPath, snapshotIndexPath, { preserveTimestamps: true } ) );
			await git( top, [ ...rawContent.args, 'add', '--all' ], { ...snapshotIndex, ...rawContent.env } );

			return ( await git( top, [ 'write-tree' ], snapshotIndex ) ).trim();
		} finally {
			await rm( snapshotIndexPath, { force: true } );
		}
	};

	return {
		async capture() {
			return { head: await getHead(), tree: await writeTree(), index: await readIfExists( () => readFile( indexPath ) ) };
		},

		async collect( snapshot ) {
			const tree = await writeTree();
			const changed = await git( top, [ 'diff-tree', '-r', '--name-only', '-z', '--no-renames', snapshot.tree, tree ] );

			return {
				changed: changed.split( '\0' ).filter( Boolean ).map( path => upath.join( top, path ) ).sort(),
				headMoved: await getHead() !== snapshot.head
			};
		},

		async restore( snapshot, paths ) {
			if ( await getHead() !== snapshot.head ) {
				await git( top, [ 'reset', '--mixed', '--quiet', snapshot.head ] );
			}

			if ( paths.length ) {
				const listed = await git( top, [ '--literal-pathspecs', 'ls-tree', '-r', '--name-only', '-z', snapshot.tree, '--',
					...paths.map( path => upath.relative( top, path ) ) ] );
				const inSnapshot = listed.split( '\0' ).filter( Boolean );

				// Removed first, so a file can replace a directory and the other way round. Paths that are not in the snapshot
				// were created after it.
				for ( const path of paths ) {
					await rm( path, { force: true, recursive: true } );
				}

				if ( inSnapshot.length ) {
					await git( top, [ ...rawContent.args, '--literal-pathspecs', 'restore', '--source', snapshot.tree, '--worktree', '--',
						...inSnapshot ], rawContent.env );
				}
			}

			// Restoring the files alone cannot undo `git add`, or recover pre-existing staged changes after a reset.
			if ( snapshot.index ) {
				await writeFile( indexPath, snapshot.index );
			} else {
				await rm( indexPath, { force: true } );
			}
		}
	};
}

/**
 * Runs git directly, because simple-git rejects a custom environment together with the `GIT_CONFIG_*` variables that
 * may be set for the process.
 */
async function git( cwd: string, args: Array<string>, env: Record<string, string> = {} ): Promise<string> {
	const { stdout } = await execFileAsync( 'git', args, {
		cwd,
		env: { ...process.env, ...env },
		encoding: 'utf8',
		maxBuffer: MAX_GIT_OUTPUT_SIZE
	} );

	return stdout;
}
