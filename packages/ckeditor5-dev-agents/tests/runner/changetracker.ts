/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { afterEach, beforeEach, describe, it, expect } from 'vitest';
import { existsSync, realpathSync } from 'node:fs';
import { chmod, lstat, readlink, rm, symlink } from 'node:fs/promises';
import upath from 'upath';
import { createChangeTracker } from '../../src/runner/changetracker.js';
import { readText, removeTempDirectories, writeFiles } from '../_utils/files.js';
import { createRepository, git, isolateGit } from '../_utils/git.js';

describe( 'createChangeTracker()', () => {
	let root: string;
	let realRoot: string;

	beforeEach( async () => {
		await isolateGit();

		root = await createRepository( {
			'docs/a.md': 'A\n',
			'docs/b.md': 'B\n',
			'docs/dirty.md': 'Dirty in HEAD\n',
			'docs/deleted-before.md': 'Deleted before\n',
			'other.txt': 'Other\n'
		} );
		realRoot = upath.normalize( realpathSync( root ) );

		// Changes that exist before the snapshot, like the kept fixes of earlier units.
		await writeFiles( root, { 'docs/dirty.md': 'Dirty in the working tree\n' } );
		await rm( upath.join( root, 'docs/deleted-before.md' ) );
	} );

	afterEach( removeTempDirectories );

	it( 'reports only what changed after the snapshot, as real absolute paths', async () => {
		const tracker = await createChangeTracker( root );
		const snapshot = await tracker.capture();

		await writeFiles( root, { 'docs/a.md': 'A changed\n', 'docs/new/c.md': 'C\n' } );
		await rm( upath.join( root, 'docs/b.md' ) );

		const { changed, headMoved } = await tracker.collect( snapshot );

		expect( headMoved ).toBe( false );
		expect( changed ).toEqual( [ `${ realRoot }/docs/a.md`, `${ realRoot }/docs/b.md`, `${ realRoot }/docs/new/c.md` ] );
	} );

	it( 'reports files that were already changed only when they change again', async () => {
		const tracker = await createChangeTracker( root );
		const snapshot = await tracker.capture();

		expect( ( await tracker.collect( snapshot ) ).changed ).toEqual( [] );

		await writeFiles( root, { 'docs/dirty.md': 'Changed again\n' } );

		expect( ( await tracker.collect( snapshot ) ).changed ).toEqual( [ `${ realRoot }/docs/dirty.md` ] );

		// Reverting a changed file to `HEAD` is a change too.
		await writeFiles( root, { 'docs/dirty.md': 'Dirty in HEAD\n' } );

		expect( ( await tracker.collect( snapshot ) ).changed ).toEqual( [ `${ realRoot }/docs/dirty.md` ] );
	} );

	it( 'reports committed changes without modifying HEAD', async () => {
		const tracker = await createChangeTracker( root );
		const snapshot = await tracker.capture();

		await writeFiles( root, { 'docs/a.md': 'Committed\n' } );
		git( root, 'commit', '--quiet', '--all', '--message', 'Sneaky.' );

		const { changed, headMoved } = await tracker.collect( snapshot );

		expect( headMoved ).toBe( true );
		expect( git( root, 'rev-parse', 'HEAD' ).trim() ).not.toBe( snapshot.head );
		expect( changed ).toContain( `${ realRoot }/docs/a.md` );
		expect( await readText( upath.join( root, 'docs/a.md' ) ) ).toBe( 'Committed\n' );
	} );

	it( 'discards the changes: restores tracked, previously changed and deleted files and removes new ones', async () => {
		const tracker = await createChangeTracker( root );
		const snapshot = await tracker.capture();

		await writeFiles( root, {
			'docs/a.md': 'A changed\n',
			'docs/dirty.md': 'Changed again\n',
			'docs/deleted-before.md': 'Recreated\n',
			'docs/new/c.md': 'C\n'
		} );
		await rm( upath.join( root, 'docs/b.md' ) );

		const { changed } = await tracker.collect( snapshot );

		await tracker.restore( snapshot, changed );

		expect( await readText( upath.join( root, 'docs/a.md' ) ) ).toBe( 'A\n' );
		expect( await readText( upath.join( root, 'docs/b.md' ) ) ).toBe( 'B\n' );
		expect( await readText( upath.join( root, 'docs/dirty.md' ) ) ).toBe( 'Dirty in the working tree\n' );
		expect( existsSync( upath.join( root, 'docs/deleted-before.md' ) ) ).toBe( false );
		expect( existsSync( upath.join( root, 'docs/new/c.md' ) ) ).toBe( false );
		expect( ( await tracker.collect( snapshot ) ).changed ).toEqual( [] );
	} );

	it( 'takes a snapshot without changing the index, and leaves no files behind', async () => {
		await writeFiles( root, { 'docs/staged.md': 'Staged\n', 'untracked.md': 'Untracked\n' } );
		git( root, 'add', 'docs/staged.md' );

		const status = git( root, 'status', '--porcelain', '--untracked-files=all' );
		const tracker = await createChangeTracker( root );

		await tracker.collect( await tracker.capture() );

		expect( git( root, 'status', '--porcelain', '--untracked-files=all' ) ).toBe( status );
		expect( existsSync( upath.join( root, '.git/index.ckeditor5-dev-agents' ) ) ).toBe( false );
	} );

	it( 'restores an untracked file that existed before the snapshot, and keeps it untracked', async () => {
		await writeFiles( root, { 'untracked.md': 'Untracked\n' } );

		const tracker = await createChangeTracker( root );
		const snapshot = await tracker.capture();

		await rm( upath.join( root, 'untracked.md' ) );
		await tracker.restore( snapshot, ( await tracker.collect( snapshot ) ).changed );

		expect( await readText( upath.join( root, 'untracked.md' ) ) ).toBe( 'Untracked\n' );
		expect( git( root, 'status', '--porcelain', '--', 'untracked.md' ) ).toBe( '?? untracked.md\n' );
	} );

	it( 'restores the exact bytes, regardless of line ending settings and the filters of attributes', async () => {
		await writeFiles( root, { '.gitattributes': '* text eol=crlf\n*.bin filter=upper\n' } );
		git( root, 'config', 'core.autocrlf', 'true' );
		git( root, 'config', 'filter.upper.clean', 'tr a-z A-Z' );
		git( root, 'config', 'filter.upper.smudge', 'tr a-z A-Z' );
		await writeFiles( root, { 'docs/mixed.md': 'LF\nCRLF\r\n', 'data.bin': 'lower case' } );

		const tracker = await createChangeTracker( root );
		const snapshot = await tracker.capture();

		await writeFiles( root, { 'docs/mixed.md': 'Changed\n', 'data.bin': 'changed' } );
		await tracker.restore( snapshot, ( await tracker.collect( snapshot ) ).changed );

		expect( await readText( upath.join( root, 'docs/mixed.md' ) ) ).toBe( 'LF\nCRLF\r\n' );
		expect( await readText( upath.join( root, 'data.bin' ) ) ).toBe( 'lower case' );
		expect( ( await tracker.collect( snapshot ) ).changed ).toEqual( [] );
	} );

	it( 'restores a file that a directory replaced', async () => {
		const tracker = await createChangeTracker( root );
		const snapshot = await tracker.capture();

		await rm( upath.join( root, 'other.txt' ) );
		await writeFiles( root, { 'other.txt/inside.txt': 'Inside\n' } );
		await tracker.restore( snapshot, ( await tracker.collect( snapshot ) ).changed );

		expect( await readText( upath.join( root, 'other.txt' ) ) ).toBe( 'Other\n' );
	} );

	it( 'restores a previously deleted file that was changed to something else', async () => {
		const tracker = await createChangeTracker( root );

		await writeFiles( root, { 'docs/dirty.md': 'Dirty in the working tree\n' } );

		const snapshot = await tracker.capture();

		await rm( upath.join( root, 'docs/dirty.md' ) );
		await tracker.restore( snapshot, ( await tracker.collect( snapshot ) ).changed );

		expect( await readText( upath.join( root, 'docs/dirty.md' ) ) ).toBe( 'Dirty in the working tree\n' );
	} );

	it( 'removes an index that did not exist before the snapshot', async () => {
		await rm( upath.join( root, '.git/index' ) );

		const tracker = await createChangeTracker( root );
		const snapshot = await tracker.capture();

		expect( snapshot.index ).toBeNull();

		git( root, 'reset', '--quiet' );
		await tracker.restore( snapshot, [] );

		expect( existsSync( upath.join( root, '.git/index' ) ) ).toBe( false );
		expect( await readText( upath.join( root, 'docs/dirty.md' ) ) ).toBe( 'Dirty in the working tree\n' );
	} );

	it( 'restores the index after discarding a staged new file', async () => {
		const tracker = await createChangeTracker( root );
		const snapshot = await tracker.capture();
		await writeFiles( root, { 'new.txt': 'New' } );
		git( root, 'add', 'new.txt' );

		await tracker.restore( snapshot, ( await tracker.collect( snapshot ) ).changed );

		expect( git( root, 'status', '--porcelain' ) ).not.toContain( 'new.txt' );
	} );

	it( 'preserves staged and unstaged local changes when undoing a commit', async () => {
		await writeFiles( root, { 'docs/dirty.md': 'Staged content' } );
		git( root, 'add', 'docs/dirty.md' );
		await writeFiles( root, { 'docs/dirty.md': 'Unstaged content' } );
		const staged = git( root, 'diff', '--cached' );
		const tracker = await createChangeTracker( root );
		const snapshot = await tracker.capture();
		await writeFiles( root, { 'docs/dirty.md': 'From fix', 'docs/a.md': 'Also fixed' } );
		git( root, 'commit', '--quiet', '--all', '--message', 'Fix commit.' );

		await tracker.restore( snapshot, ( await tracker.collect( snapshot ) ).changed );

		expect( git( root, 'rev-parse', 'HEAD' ).trim() ).toBe( snapshot.head );
		expect( git( root, 'diff', '--cached' ) ).toBe( staged );
		expect( await readText( upath.join( root, 'docs/dirty.md' ) ) ).toBe( 'Unstaged content' );
	} );

	it( 'detects untracked files outside a target subdirectory', async () => {
		const tracker = await createChangeTracker( upath.join( root, 'docs' ) );
		const snapshot = await tracker.capture();
		await writeFiles( root, { 'outside.txt': 'New' } );

		expect( ( await tracker.collect( snapshot ) ).changed ).toEqual( [ `${ realRoot }/outside.txt` ] );
	} );

	it( 'restores permissions and symlink targets of previously dirty files', async () => {
		const file = upath.join( root, 'docs/dirty.md' );
		const link = upath.join( root, 'link' );
		await chmod( file, 0o755 );
		await symlink( 'docs/a.md', link );
		const tracker = await createChangeTracker( root );
		const snapshot = await tracker.capture();
		await chmod( file, 0o644 );
		await rm( link );
		await symlink( 'docs/b.md', link );

		await tracker.restore( snapshot, ( await tracker.collect( snapshot ) ).changed );

		expect( ( await lstat( file ) ).mode & 0o777 ).toBe( 0o755 );
		expect( await readlink( link ) ).toBe( 'docs/a.md' );
		expect( ( await tracker.collect( snapshot ) ).changed ).toEqual( [] );
	} );

	it( 'discards changes of tracked files when the root is a subdirectory of the repository', async () => {
		const tracker = await createChangeTracker( upath.join( root, 'docs' ) );
		const snapshot = await tracker.capture();

		await writeFiles( root, { 'docs/a.md': 'A changed\n' } );
		await tracker.restore( snapshot, ( await tracker.collect( snapshot ) ).changed );

		expect( await readText( upath.join( root, 'docs/a.md' ) ) ).toBe( 'A\n' );
	} );
} );
