/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-disable @stylistic/max-len */

import { afterEach, beforeEach, describe, it, expect } from 'vitest';
import { existsSync, realpathSync } from 'node:fs';
import upath from 'upath';
import { openWorkspace } from '../../src/git/gitworkspace.js';
import { createTempDirectory, readText, removeTempDirectories, writeFiles } from '../_utils/files.js';
import { createCheckout, createRemote, createRepository, git, isolateGit, pushFiles } from '../_utils/git.js';

describe( 'openWorkspace()', () => {
	const author = { name: 'Bot', email: 'bot@example.com' };
	const reportBranch = 'ai-tasks/t/cs/stable';

	let remote: string;
	let seed: string;
	let path: string;

	beforeEach( async () => {
		await isolateGit();

		( { remote, seed } = await createRemote( { 'projects/cs/docs/a.md': 'A\n', 'README.md': 'Readme\n' } ) );
		path = await createCheckout( remote );
	} );

	afterEach( removeTempDirectories );

	const open = ( cwd = path ) => openWorkspace( { cwd, author } );

	it( 'opens the checkout that contains the directory and returns the real path of its top level', async () => {
		const workspace = await open( upath.join( path, 'projects/cs' ) );

		expect( workspace.path ).toBe( upath.normalize( realpathSync( path ) ) );
		expect( workspace.branch ).toBe( 'stable' );
	} );

	it( 'throws when the directory is not inside a git repository', async () => {
		const directory = await createTempDirectory();

		await expect( open( directory ) ).rejects.toThrow( `"${ directory }" is not inside a git repository.` );
	} );

	it( 'reports a detached HEAD as the `HEAD` branch', async () => {
		git( path, 'checkout', '--quiet', '--detach' );

		expect( ( await open() ).branch ).toBe( 'HEAD' );
	} );

	describe( 'originSlug', () => {
		it.each( [
			[ 'git@github.com:owner/repo.git', 'owner/repo' ],
			[ 'https://github.com/owner/repo', 'owner/repo' ],
			[ 'https://github.com/owner/repo.git', 'owner/repo' ],
			[ 'https://github.com/owner/repo.name/', 'owner/repo.name' ],
			[ 'https://gitlab.com/owner/repo.git', undefined ]
		] )( 'reads %s as %s', async ( url, slug ) => {
			git( path, 'remote', 'set-url', 'origin', url );

			expect( ( await open() ).originSlug ).toBe( slug );
		} );

		it( 'is undefined without `origin`', async () => {
			const repository = await createRepository( { 'a.md': 'A\n' } );

			expect( ( await open( repository ) ).originSlug ).toBeUndefined();
		} );
	} );

	describe( 'assertPublishable()', () => {
		it( 'passes for a clean, full checkout of a branch', async () => {
			await expect( ( await open() ).assertPublishable( [ 'projects/cs/.ai-tasks/t/open.json' ] ) ).resolves.toBeUndefined();
			await expect( ( await open() ).assertPublishable( [] ) ).resolves.toBeUndefined();
		} );

		it( 'throws for a detached HEAD', async () => {
			git( path, 'checkout', '--quiet', '--detach' );

			await expect( ( await open() ).assertPublishable( [] ) ).rejects.toThrow(
				'Publishing needs a checked-out branch, but HEAD is detached. Check out the base branch first.'
			);
		} );

		it( 'throws for a shallow checkout', async () => {
			await pushFiles( seed, { 'README.md': 'Changed\n' } );

			const shallow = await createCheckout( `file://${ remote }`, '--depth', '1' );

			await expect( ( await open( shallow ) ).assertPublishable( [] ) ).rejects.toThrow(
				'Publishing needs the full history of the checkout, but it is shallow. Configure the checkout in CI to fetch the whole history.'
			);
		} );

		it( 'throws for uncommitted changes', async () => {
			await writeFiles( path, { 'README.md': 'Local change\n' } );

			await expect( ( await open() ).assertPublishable( [] ) ).rejects.toThrow(
				'Publishing needs a clean working tree, but it has uncommitted changes. Commit or remove them first.'
			);
		} );

		it( 'throws for ignored paths that the run must commit', async () => {
			await pushFiles( seed, { '.gitignore': '.*\n!.gitignore\n' } );
			git( path, 'pull', '--quiet' );

			await expect( ( await open() ).assertPublishable( [ 'projects/cs/.ai-tasks/t/open.json', 'projects/cs/docs/a.md' ] ) ).rejects.toThrow(
				'Publishing commits the state of the tasks, but a `.gitignore` file ignores it: projects/cs/.ai-tasks/t/open.json. ' +
				'Stop ignoring these paths first.'
			);
		} );

		it( 'does not report ignored paths that are already tracked', async () => {
			await pushFiles( seed, { 'projects/cs/.ai-tasks/t/open.json': '[]\n' } );
			await pushFiles( seed, { '.gitignore': '.*\n!.gitignore\n' } );
			git( path, 'pull', '--quiet' );

			await expect( ( await open() ).assertPublishable( [ 'projects/cs/.ai-tasks/t/open.json' ] ) ).resolves.toBeUndefined();
		} );
	} );

	it( 'starts a fresh report branch at the base, commits only the given paths as the author and pushes it', async () => {
		const workspace = await open();

		await workspace.checkoutReportBranch( { name: reportBranch, continueExisting: false } );
		await writeFiles( path, { 'projects/cs/.ai-tasks/t/open.json': '[]\n', 'projects/cs/docs/a.md': 'Fixed\n', 'projects/cs/docs/b.md': 'Unrelated\n' } );

		expect( git( path, 'rev-parse', '--abbrev-ref', 'HEAD' ).trim() ).toBe( reportBranch );
		expect( await workspace.commit( [ 'projects/cs/.ai-tasks/t', 'projects/cs/docs/a.md' ], 'Task: 1 unit judged.' ) ).toBe( true );
		expect( await workspace.commit( [ 'projects/cs/.ai-tasks/t' ], 'Nothing.' ) ).toBe( false );

		await workspace.push();

		expect( git( remote, 'log', '--format=%s|%an|%ae', reportBranch ).trim().split( '\n' )[ 0 ] ).toBe( 'Task: 1 unit judged.|Bot|bot@example.com' );
		expect( git( remote, 'show', '--name-only', '--format=', reportBranch ).trim().split( '\n' ) )
			.toEqual( [ 'projects/cs/.ai-tasks/t/open.json', 'projects/cs/docs/a.md' ] );
	} );

	it( 'does not commit files staged outside of the given paths', async () => {
		const workspace = await open();

		await workspace.checkoutReportBranch( { name: reportBranch, continueExisting: false } );
		await writeFiles( path, { 'projects/cs/.ai-tasks/t/open.json': '[]\n', 'README.md': 'Staged\n' } );
		git( path, 'add', 'README.md' );

		expect( await workspace.commit( [ 'projects/cs/docs/a.md' ], 'Nothing.' ) ).toBe( false );
		expect( await workspace.commit( [ 'projects/cs/.ai-tasks/t' ], 'State.' ) ).toBe( true );

		expect( git( path, 'show', '--name-only', '--format=', 'HEAD' ).trim() ).toBe( 'projects/cs/.ai-tasks/t/open.json' );
		expect( git( path, 'status', '--porcelain' ).trim() ).toBe( 'M  README.md' );
	} );

	it( 'continues an existing report branch, merges the base branch into it, and pushes without force', async () => {
		const first = await open();

		await first.checkoutReportBranch( { name: reportBranch, continueExisting: false } );
		await writeFiles( path, { 'projects/cs/.ai-tasks/t/open.json': '[]\n' } );
		await first.commit( [ 'projects/cs/.ai-tasks' ], 'State.' );
		await first.push();
		await first.returnToBase();

		await pushFiles( seed, { 'projects/cs/docs/b.md': 'B\n' } );

		// CI prepares a new checkout of the base branch for every run.
		const checkout = await createCheckout( remote );
		const second = await open( checkout );

		await second.checkoutReportBranch( { name: reportBranch, continueExisting: true } );

		expect( existsSync( upath.join( checkout, 'projects/cs/.ai-tasks/t/open.json' ) ) ).toBe( true );
		expect( existsSync( upath.join( checkout, 'projects/cs/docs/b.md' ) ) ).toBe( true );
		expect( git( checkout, 'log', '-1', '--format=%s' ).trim() ).toBe( `Merge stable into ${ reportBranch }.` );

		await writeFiles( checkout, { 'projects/cs/.ai-tasks/t/open.json': '[ 1 ]\n' } );
		await second.commit( [ 'projects/cs/.ai-tasks' ], 'More state.' );
		await second.push();

		const log = git( remote, 'log', '--format=%s', reportBranch ).trim().split( '\n' );

		expect( log.slice( 0, 2 ) ).toEqual( [ 'More state.', `Merge stable into ${ reportBranch }.` ] );
		expect( log ).toContain( 'More changes.' );
	} );

	it( 'starts at the base branch when it should continue a branch that does not exist', async () => {
		const workspace = await open();

		await workspace.checkoutReportBranch( { name: reportBranch, continueExisting: true } );

		expect( git( path, 'rev-parse', '--abbrev-ref', 'HEAD' ).trim() ).toBe( reportBranch );
		expect( git( path, 'rev-parse', 'HEAD' ).trim() ).toBe( git( remote, 'rev-parse', 'stable' ).trim() );
	} );

	it( 'replaces a leftover branch with a forced push, and pushes normally after that', async () => {
		const first = await open();

		await first.checkoutReportBranch( { name: reportBranch, continueExisting: false } );
		await writeFiles( path, { 'projects/cs/.ai-tasks/t/open.json': 'old\n' } );
		await first.commit( [ 'projects/cs/.ai-tasks' ], 'Old state.' );
		await first.push();

		await pushFiles( seed, { 'README.md': 'Changed\n' } );

		const checkout = await createCheckout( remote );
		const second = await open( checkout );

		await second.checkoutReportBranch( { name: reportBranch, continueExisting: false } );
		await writeFiles( checkout, { 'projects/cs/.ai-tasks/t/open.json': 'new\n' } );
		await second.commit( [ 'projects/cs/.ai-tasks' ], 'New state.' );
		await second.push();

		await writeFiles( checkout, { 'projects/cs/.ai-tasks/t/open.json': 'newer\n' } );
		await second.commit( [ 'projects/cs/.ai-tasks' ], 'Newer state.' );
		await second.push();

		expect( git( remote, 'log', '--format=%s', reportBranch ).trim().split( '\n' ) ).toEqual( [ 'Newer state.', 'New state.', 'More changes.', 'Initial commit.' ] );
	} );

	it( 'aborts a conflicting merge and throws with the cause', async () => {
		const first = await open();

		await first.checkoutReportBranch( { name: reportBranch, continueExisting: false } );
		await writeFiles( path, { 'projects/cs/.ai-tasks/t/open.json': 'report\n' } );
		await first.commit( [ 'projects/cs/.ai-tasks' ], 'State.' );
		await first.push();

		await pushFiles( seed, { 'projects/cs/.ai-tasks/t/open.json': 'base\n' } );

		const checkout = await createCheckout( remote );
		const second = await open( checkout );
		const error = await second.checkoutReportBranch( { name: reportBranch, continueExisting: true } ).catch( ( error: Error ) => error );

		expect( ( error as Error ).message ).toMatch(
			new RegExp( `^Merging "stable" into "${ reportBranch }" failed\\. Resolve the conflict in the report pull request by hand\\. Details: ` )
		);
		expect( ( error as Error ).cause ).toBeInstanceOf( Error );
		expect( git( checkout, 'status', '--porcelain' ).trim() ).toBe( '' );
		expect( existsSync( upath.join( checkout, '.git/MERGE_HEAD' ) ) ).toBe( false );
	} );

	it( 'throws when the merge cannot even start', async () => {
		// A report branch with an unrelated history cannot be merged, and there is no merge to abort.
		git( seed, 'checkout', '--quiet', '--orphan', 'unrelated' );
		git( seed, 'rm', '-r', '--quiet', '--cached', '.' );
		await writeFiles( seed, { 'unrelated.txt': 'x' } );
		git( seed, 'add', 'unrelated.txt' );
		git( seed, 'commit', '--quiet', '--message', 'Unrelated.' );
		git( seed, 'push', '--quiet', 'origin', `HEAD:${ reportBranch }` );

		const workspace = await open();

		await expect( workspace.checkoutReportBranch( { name: reportBranch, continueExisting: true } ) )
			.rejects.toThrow( `Merging "stable" into "${ reportBranch }" failed.` );
	} );

	it( 'drops what a task left behind and checks out the base branch again', async () => {
		const workspace = await open();

		await workspace.checkoutReportBranch( { name: reportBranch, continueExisting: false } );
		await writeFiles( path, { 'projects/cs/docs/a.md': 'Half-way\n', 'projects/cs/docs/untracked.md': 'x' } );
		await workspace.returnToBase();

		expect( git( path, 'rev-parse', '--abbrev-ref', 'HEAD' ).trim() ).toBe( 'stable' );
		expect( await readText( upath.join( path, 'projects/cs/docs/a.md' ) ) ).toBe( 'A\n' );
		expect( existsSync( upath.join( path, 'projects/cs/docs/untracked.md' ) ) ).toBe( false );
		expect( git( path, 'status', '--porcelain' ).trim() ).toBe( '' );
	} );
	describe( 'refExists()', () => {
		it( 'tells whether a branch, a remote branch or a commit exists', async () => {
			const workspace = await open();

			expect( await workspace.refExists( 'stable' ) ).toBe( true );
			expect( await workspace.refExists( 'origin/stable' ) ).toBe( true );
			expect( await workspace.refExists( git( path, 'rev-parse', 'HEAD' ).trim() ) ).toBe( true );
			expect( await workspace.refExists( 'missing' ) ).toBe( false );
			expect( await workspace.refExists( 'origin/missing' ) ).toBe( false );
		} );
	} );

	describe( 'hasChanges()', () => {
		it( 'tells whether any of the files is changed, staged or untracked', async () => {
			const workspace = await open();

			expect( await workspace.hasChanges( [ 'projects/cs/docs/a.md', 'README.md' ] ) ).toBe( false );

			await writeFiles( path, { 'projects/cs/docs/a.md': 'Changed\n', 'projects/cs/docs/new.md': 'New\n', 'README.md': 'Staged\n' } );
			git( path, 'add', 'README.md' );

			expect( await workspace.hasChanges( [ 'projects/cs/docs/a.md' ] ) ).toBe( true );
			expect( await workspace.hasChanges( [ 'projects/cs/docs/new.md' ] ) ).toBe( true );
			expect( await workspace.hasChanges( [ 'README.md' ] ) ).toBe( true );
			expect( await workspace.hasChanges( [ 'projects/cs/docs/missing.md' ] ) ).toBe( false );
		} );
	} );

	describe( 'restore()', () => {
		it( 'restores changed files to their content at the ref and deletes files the ref does not have', async () => {
			const workspace = await open();

			await writeFiles( path, { 'projects/cs/docs/a.md': 'Changed\n', 'projects/cs/docs/new.md': 'New\n', 'README.md': 'Also changed\n' } );
			git( path, 'add', 'projects/cs/docs/new.md' );

			await workspace.restore( [ 'projects/cs/docs/a.md', 'projects/cs/docs/new.md', 'projects/cs/docs/untracked.md' ], 'HEAD' );

			expect( await readText( upath.join( path, 'projects/cs/docs/a.md' ) ) ).toBe( 'A\n' );
			expect( existsSync( upath.join( path, 'projects/cs/docs/new.md' ) ) ).toBe( false );
			// Files outside of the given paths are not touched.
			expect( git( path, 'status', '--porcelain' ).trim() ).toBe( 'M README.md' );
		} );

		it( 'restores from another ref', async () => {
			await pushFiles( seed, { 'projects/cs/docs/a.md': 'Newer\n' } );
			git( path, 'fetch', '--quiet', 'origin' );

			const workspace = await open();

			await workspace.restore( [ 'projects/cs/docs/a.md' ], 'origin/stable' );

			expect( await readText( upath.join( path, 'projects/cs/docs/a.md' ) ) ).toBe( 'Newer\n' );
		} );
	} );
} );
