/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-disable @stylistic/max-len */

import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { existsSync, realpathSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
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

		it( 'throws for a base branch whose name ends like a part of a stack', async () => {
			git( path, 'checkout', '--quiet', '-b', 'release--2' );

			await expect( ( await open() ).assertPublishable( [] ) ).rejects.toThrow(
				'Publishing cannot start at the "release--2" branch: report branches use the "--<number>" ending for the parts of a stack'
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

		await workspace.checkoutReportBranch( { name: reportBranch, stack: [] } );
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

		await workspace.checkoutReportBranch( { name: reportBranch, stack: [] } );
		await writeFiles( path, { 'projects/cs/.ai-tasks/t/open.json': '[]\n', 'README.md': 'Staged\n' } );
		git( path, 'add', 'README.md' );

		expect( await workspace.commit( [ 'projects/cs/docs/a.md' ], 'Nothing.' ) ).toBe( false );
		expect( await workspace.commit( [ 'projects/cs/.ai-tasks/t' ], 'State.' ) ).toBe( true );

		expect( git( path, 'show', '--name-only', '--format=', 'HEAD' ).trim() ).toBe( 'projects/cs/.ai-tasks/t/open.json' );
		expect( git( path, 'status', '--porcelain' ).trim() ).toBe( 'M  README.md' );
	} );

	it( 'stacks a new report branch on the open ones, merges every parent into its child, and pushes them without force', async () => {
		const first = await open();
		const second = `${ reportBranch }--2`;
		const third = `${ reportBranch }--3`;

		await first.checkoutReportBranch( { name: reportBranch, stack: [] } );
		await writeFiles( path, { 'projects/cs/.ai-tasks/t/open.json': '[ 1 ]\n' } );
		await first.commit( [ 'projects/cs/.ai-tasks' ], 'First.' );
		await first.push();
		await first.checkoutReportBranch( { name: second, stack: [ reportBranch ] } );
		await writeFiles( path, { 'projects/cs/.ai-tasks/t/open.json': '[ 1, 2 ]\n' } );
		await first.commit( [ 'projects/cs/.ai-tasks' ], 'Second.' );
		await first.push();
		await first.returnToBase();

		await pushFiles( seed, { 'projects/cs/docs/b.md': 'B\n' } );

		// CI prepares a new checkout of the base branch for every run.
		const checkout = await createCheckout( remote );
		const next = await open( checkout );

		await next.checkoutReportBranch( { name: third, stack: [ reportBranch, second ] } );

		expect( git( checkout, 'rev-parse', '--abbrev-ref', 'HEAD' ).trim() ).toBe( third );
		expect( await readText( upath.join( checkout, 'projects/cs/.ai-tasks/t/open.json' ) ) ).toBe( '[ 1, 2 ]\n' );
		expect( existsSync( upath.join( checkout, 'projects/cs/docs/b.md' ) ) ).toBe( true );

		await writeFiles( checkout, { 'projects/cs/.ai-tasks/t/open.json': '[ 1, 2, 3 ]\n' } );
		await next.commit( [ 'projects/cs/.ai-tasks' ], 'Third.' );
		await next.push();

		const subjects = ( branch: string, count: number ) => git( remote, 'log', '--first-parent', `-${ count }`, '--format=%s', branch ).trim().split( '\n' );

		expect( subjects( reportBranch, 2 ) ).toEqual( [ `Merge stable into ${ reportBranch }.`, 'First.' ] );
		expect( subjects( second, 2 ) ).toEqual( [ `Merge ${ reportBranch } into ${ second }.`, 'Second.' ] );
		expect( subjects( third, 3 ) ).toEqual( [ 'Third.', `Merge ${ reportBranch } into ${ second }.`, 'Second.' ] );

		// Each branch shows only its own change against its parent.
		expect( git( remote, 'diff', '--name-only', reportBranch, second ).trim() ).toBe( 'projects/cs/.ai-tasks/t/open.json' );
		expect( git( remote, 'diff', '--name-only', 'stable', reportBranch ).trim() ).toBe( 'projects/cs/.ai-tasks/t/open.json' );
	} );

	it( 'pushes only the branches of the stack that got a merge', async () => {
		const first = await open();
		const second = `${ reportBranch }--2`;

		await first.checkoutReportBranch( { name: reportBranch, stack: [] } );
		await writeFiles( path, { 'projects/cs/.ai-tasks/t/open.json': '[ 1 ]\n' } );
		await first.commit( [ 'projects/cs/.ai-tasks' ], 'First.' );
		await first.push();

		const pushed = git( remote, 'rev-parse', reportBranch ).trim();
		const checkout = await createCheckout( remote );
		const next = await open( checkout );

		await next.checkoutReportBranch( { name: second, stack: [ reportBranch ] } );
		await writeFiles( checkout, { 'projects/cs/.ai-tasks/t/open.json': '[ 1, 2 ]\n' } );
		await next.commit( [ 'projects/cs/.ai-tasks' ], 'Second.' );
		await next.push();

		expect( git( remote, 'rev-parse', reportBranch ).trim() ).toBe( pushed );
		expect( git( remote, 'log', '-1', '--format=%s', second ).trim() ).toBe( 'Second.' );
	} );

	describe( 'the git configuration of the checkout', () => {
		let signer: string;
		let signerLog: string;

		// A stand-in for GPG: it records its arguments and returns a signature git accepts.
		beforeEach( async () => {
			const directory = await createTempDirectory();

			signer = upath.join( directory, 'gpg' );
			signerLog = upath.join( directory, 'gpg.log' );

			await writeFile( signer, [
				'#!/bin/sh',
				`echo "$@" >> "${ signerLog }"`,
				'cat > /dev/null',
				'echo "[GNUPG:] SIG_CREATED D 1 8 00 0 FAKE" >&2',
				'printf -- "-----BEGIN PGP SIGNATURE-----\\n\\nZmFrZQ==\\n-----END PGP SIGNATURE-----\\n"'
			].join( '\n' ), { mode: 0o755 } );
		} );

		const configureBot = ( checkout: string ) => {
			git( checkout, 'config', 'user.name', 'CKEditorBot' );
			git( checkout, 'config', 'user.email', 'bot@ckeditor.com' );
			git( checkout, 'config', 'user.signingkey', 'ABCDEF0123456789' );
			git( checkout, 'config', 'commit.gpgsign', 'true' );
			git( checkout, 'config', 'gpg.program', signer );
		};

		it.skipIf( process.platform === 'win32' )( 'commits as its author and signs the commits and the merges', async () => {
			configureBot( path );

			const first = await openWorkspace( { cwd: path } );

			await first.checkoutReportBranch( { name: reportBranch, stack: [] } );
			await writeFiles( path, { 'projects/cs/.ai-tasks/t/open.json': '[]\n' } );
			await first.commit( [ 'projects/cs/.ai-tasks' ], 'State.' );
			await first.push();
			await first.returnToBase();
			await pushFiles( seed, { 'projects/cs/docs/b.md': 'B\n' } );

			const checkout = await createCheckout( remote );

			configureBot( checkout );

			await ( await openWorkspace( { cwd: checkout } ) ).checkoutReportBranch( { name: `${ reportBranch }--2`, stack: [ reportBranch ] } );

			expect( git( checkout, 'log', '-2', '--first-parent', '--format=%an|%ae' ).trim().split( '\n' ) )
				.toEqual( [ 'CKEditorBot|bot@ckeditor.com', 'CKEditorBot|bot@ckeditor.com' ] );
			expect( git( checkout, 'cat-file', 'commit', 'HEAD' ) ).toContain( 'gpgsig -----BEGIN PGP SIGNATURE-----' );
			expect( git( checkout, 'cat-file', 'commit', 'HEAD^1' ) ).toContain( 'gpgsig -----BEGIN PGP SIGNATURE-----' );
			expect( await readText( signerLog ) ).toContain( 'ABCDEF0123456789' );
		} );

		it( 'lets the given author override the one of the configuration', async () => {
			git( path, 'config', 'user.name', 'CKEditorBot' );
			git( path, 'config', 'user.email', 'bot@ckeditor.com' );

			const workspace = await openWorkspace( { cwd: path, author: { name: 'Bot' } } );

			await workspace.checkoutReportBranch( { name: reportBranch, stack: [] } );
			await writeFiles( path, { 'projects/cs/.ai-tasks/t/open.json': '[]\n' } );
			await workspace.commit( [ 'projects/cs/.ai-tasks' ], 'State.' );

			expect( git( path, 'log', '-1', '--format=%an|%ae' ).trim() ).toBe( 'Bot|bot@ckeditor.com' );
		} );

		it( 'cannot be published from without an author', async () => {
			await expect( openWorkspace( { cwd: path } ).then( workspace => workspace.assertPublishable( [] ) ) ).rejects.toThrow(
				'Publishing needs the author of the commits, but `user.name` is not set in the git configuration.'
			);
		} );
	} );

	it( 'replaces a leftover branch with a forced push, and pushes normally after that', async () => {
		const first = await open();

		await first.checkoutReportBranch( { name: reportBranch, stack: [] } );
		await writeFiles( path, { 'projects/cs/.ai-tasks/t/open.json': 'old\n' } );
		await first.commit( [ 'projects/cs/.ai-tasks' ], 'Old state.' );
		await first.push();

		await pushFiles( seed, { 'README.md': 'Changed\n' } );

		const checkout = await createCheckout( remote );
		const second = await open( checkout );

		await second.checkoutReportBranch( { name: reportBranch, stack: [] } );
		await writeFiles( checkout, { 'projects/cs/.ai-tasks/t/open.json': 'new\n' } );
		await second.commit( [ 'projects/cs/.ai-tasks' ], 'New state.' );
		await second.push();

		await writeFiles( checkout, { 'projects/cs/.ai-tasks/t/open.json': 'newer\n' } );
		await second.commit( [ 'projects/cs/.ai-tasks' ], 'Newer state.' );
		await second.push();

		expect( git( remote, 'log', '--format=%s', reportBranch ).trim().split( '\n' ) ).toEqual( [ 'Newer state.', 'New state.', 'More changes.', 'Initial commit.' ] );
	} );

	it( 'does not replace a leftover branch that another run pushed meanwhile', async () => {
		await pushFiles( seed, { 'README.md': 'Leftover\n' }, reportBranch );

		const workspace = await open();

		await workspace.checkoutReportBranch( { name: reportBranch, stack: [] } );
		await pushFiles( seed, { 'README.md': 'Another run\n' }, reportBranch );
		await writeFiles( path, { 'projects/cs/.ai-tasks/t/open.json': '[]\n' } );
		await workspace.commit( [ 'projects/cs/.ai-tasks' ], 'State.' );

		await expect( workspace.push() ).rejects.toThrow( /stale info|rejected/ );
		expect( git( remote, 'log', '-1', '--format=%s', reportBranch ).trim() ).toBe( 'More changes.' );
		expect( git( remote, 'show', `${ reportBranch }:README.md` ) ).toBe( 'Another run\n' );
	} );

	it( 'aborts a conflicting merge and throws with the cause', async () => {
		const first = await open();

		await first.checkoutReportBranch( { name: reportBranch, stack: [] } );
		await writeFiles( path, { 'projects/cs/.ai-tasks/t/open.json': 'report\n' } );
		await first.commit( [ 'projects/cs/.ai-tasks' ], 'State.' );
		await first.push();

		await pushFiles( seed, { 'projects/cs/.ai-tasks/t/open.json': 'base\n' } );

		const checkout = await createCheckout( remote );
		const second = await open( checkout );
		const error = await second.checkoutReportBranch( { name: `${ reportBranch }--2`, stack: [ reportBranch ] } ).catch( ( error: Error ) => error );

		expect( ( error as Error ).message ).toMatch(
			new RegExp( `^Merging "stable" into "${ reportBranch }" failed\\. Resolve the conflict in its report pull request by hand\\. Details: ` )
		);
		expect( ( error as Error ).cause ).toBeInstanceOf( Error );
		expect( git( checkout, 'status', '--porcelain' ).trim() ).toBe( '' );
		expect( existsSync( upath.join( checkout, '.git/MERGE_HEAD' ) ) ).toBe( false );
	} );

	describe( 'resolving the conflicts of a merge', () => {
		const second = () => `${ reportBranch }--2`;

		// The report branch and the base branch change the same line of `open.json`.
		beforeEach( async () => {
			const first = await open();

			await first.checkoutReportBranch( { name: reportBranch, stack: [] } );
			await writeFiles( path, { 'projects/cs/.ai-tasks/t/open.json': 'report\n' } );
			await first.commit( [ 'projects/cs/.ai-tasks' ], 'State.' );
			await first.push();
			await first.returnToBase();
			await pushFiles( seed, { 'projects/cs/.ai-tasks/t/open.json': 'base\n' } );
		} );

		it( 'passes every conflicted file with its three versions, and commits the merge with the resolved files', async () => {
			const checkout = await createCheckout( remote );
			const workspace = await open( checkout );
			const resolveConflicts = vi.fn( async () => new Map( [
				[ 'projects/cs/.ai-tasks/t/open.json', 'resolved\n' ],
				[ 'projects/cs/.ai-tasks/t/report.md', 'Rendered again.\n' ]
			] ) );

			await workspace.checkoutReportBranch( { name: second(), stack: [ reportBranch ], resolveConflicts } );

			expect( resolveConflicts ).toHaveBeenCalledExactlyOnceWith( [
				{ path: 'projects/cs/.ai-tasks/t/open.json', base: null, ours: 'report\n', theirs: 'base\n' }
			] );
			expect( git( checkout, 'log', '-1', '--format=%s|%P' ).trim() ).toMatch( new RegExp( `^Merge stable into ${ reportBranch }\\.\\|\\S+ \\S+$` ) );
			expect( git( checkout, 'show', 'HEAD:projects/cs/.ai-tasks/t/open.json' ) ).toBe( 'resolved\n' );
			expect( git( checkout, 'show', 'HEAD:projects/cs/.ai-tasks/t/report.md' ) ).toBe( 'Rendered again.\n' );
			expect( git( checkout, 'status', '--porcelain' ).trim() ).toBe( '' );

			await writeFiles( checkout, { 'projects/cs/.ai-tasks/t/open.json': 'next\n' } );
			await workspace.commit( [ 'projects/cs/.ai-tasks' ], 'Next.' );
			await workspace.push();

			expect( git( remote, 'show', `${ reportBranch }:projects/cs/.ai-tasks/t/open.json` ) ).toBe( 'resolved\n' );
		} );

		it.each( [
			[ 'cannot resolve them', null ],
			[ 'leaves a conflicted file out', new Map( [ [ 'projects/cs/.ai-tasks/t/report.md', 'x' ] ] ) ]
		] )( 'aborts the merge and throws when the resolver %s', async ( _, result ) => {
			const checkout = await createCheckout( remote );
			const workspace = await open( checkout );

			await expect( workspace.checkoutReportBranch( { name: second(), stack: [ reportBranch ], resolveConflicts: async () => result } ) )
				.rejects.toThrow( `Merging "stable" into "${ reportBranch }" failed.` );
			expect( git( checkout, 'status', '--porcelain' ).trim() ).toBe( '' );
			expect( existsSync( upath.join( checkout, '.git/MERGE_HEAD' ) ) ).toBe( false );
		} );
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
		const resolveConflicts = vi.fn( async () => new Map() );

		await expect( workspace.checkoutReportBranch( { name: `${ reportBranch }--2`, stack: [ reportBranch ], resolveConflicts } ) )
			.rejects.toThrow( `Merging "stable" into "${ reportBranch }" failed.` );
		expect( resolveConflicts ).not.toHaveBeenCalled();
	} );

	it( 'drops what a task left behind and checks out the base branch again', async () => {
		const workspace = await open();

		await workspace.checkoutReportBranch( { name: reportBranch, stack: [] } );
		await writeFiles( path, { 'projects/cs/docs/a.md': 'Half-way\n', 'projects/cs/docs/untracked.md': 'x' } );
		await workspace.returnToBase();

		expect( git( path, 'rev-parse', '--abbrev-ref', 'HEAD' ).trim() ).toBe( 'stable' );
		expect( await readText( upath.join( path, 'projects/cs/docs/a.md' ) ) ).toBe( 'A\n' );
		expect( existsSync( upath.join( path, 'projects/cs/docs/untracked.md' ) ) ).toBe( false );
		expect( git( path, 'status', '--porcelain' ).trim() ).toBe( '' );
	} );
	describe( 'fetchBranches()', () => {
		it( 'fetches the branches that exist on `origin` into their remote-tracking refs, and returns them', async () => {
			const workspace = await open();

			git( seed, 'push', '--quiet', 'origin', 'HEAD:other' );
			await pushFiles( seed, { 'README.md': 'Changed\n' } );

			expect( await workspace.fetchBranches( [ 'stable', 'other', 'gone' ] ) ).toEqual( [ 'stable', 'other' ] );
			expect( git( path, 'rev-parse', 'origin/stable' ).trim() ).toBe( git( remote, 'rev-parse', 'stable' ).trim() );
			expect( git( path, 'rev-parse', 'origin/other' ).trim() ).toBe( git( remote, 'rev-parse', 'other' ).trim() );
			expect( await workspace.refExists( 'origin/gone' ) ).toBe( false );
		} );

		it( 'fetches nothing when none of the branches exists', async () => {
			expect( await ( await open() ).fetchBranches( [ 'gone' ] ) ).toEqual( [] );
		} );
	} );

	describe( 'isAncestor()', () => {
		it( 'tells whether a commit is in the history of another one', async () => {
			const workspace = await open();

			await pushFiles( seed, { 'README.md': 'Changed\n' } );
			git( path, 'fetch', '--quiet', 'origin' );

			expect( await workspace.isAncestor( 'stable', 'origin/stable' ) ).toBe( true );
			expect( await workspace.isAncestor( 'origin/stable', 'stable' ) ).toBe( false );
		} );

		it( 'returns `false` for commits without a common ancestor', async () => {
			git( path, 'checkout', '--quiet', '--orphan', 'unrelated' );
			git( path, 'commit', '--quiet', '--allow-empty', '--message', 'Unrelated.' );

			const workspace = await open();

			expect( await workspace.isAncestor( 'unrelated', 'stable' ) ).toBe( false );
		} );
	} );

	describe( 'differsFrom()', () => {
		it( 'tells whether any of the files differs between the working tree and the ref', async () => {
			const workspace = await open();

			expect( await workspace.differsFrom( [ 'README.md', 'projects/cs/docs/a.md' ], 'HEAD' ) ).toBe( false );

			await writeFiles( path, { 'README.md': 'Changed\n' } );

			expect( await workspace.differsFrom( [ 'README.md' ], 'HEAD' ) ).toBe( true );
			expect( await workspace.differsFrom( [ 'projects/cs/docs/a.md' ], 'HEAD' ) ).toBe( false );
		} );
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

	describe( 'the environment of git', () => {
		it( 'ignores the git configuration of the machine', async () => {
			// `isolateGit()` points `GIT_CONFIG_GLOBAL` to an empty file, so git must not read this one.
			const home = await createTempDirectory();

			await writeFiles( home, { '.gitconfig': '[status]\n\tshowUntrackedFiles = no\n' } );
			vi.stubEnv( 'HOME', home );
			vi.stubEnv( 'XDG_CONFIG_HOME', upath.join( home, '.config' ) );
			await writeFiles( path, { 'projects/cs/docs/new.md': 'New\n' } );

			expect( await ( await open() ).hasChanges( [ 'projects/cs/docs/new.md' ] ) ).toBe( true );
		} );

		// The fake `ssh` is a POSIX shell script, and the remote URL takes a POSIX path, so the test does not run on Windows.
		it.skipIf( process.platform === 'win32' )( 'reaches the remote with the credentials that the environment gives to git', async () => {
			// A CI job can give the credentials in `GIT_SSH_COMMAND`. This fake `ssh` runs the git command of the remote locally.
			const ssh = upath.join( await createTempDirectory(), 'ssh' );

			await writeFile( ssh, '#!/bin/sh\nfor last; do :; done\nexec sh -c "$last"\n', { mode: 0o755 } );
			vi.stubEnv( 'GIT_SSH_COMMAND', ssh );
			git( path, 'remote', 'set-url', 'origin', `ssh://127.0.0.1:1${ remote }` );

			const workspace = await open();

			await workspace.checkoutReportBranch( { name: reportBranch, stack: [] } );
			await writeFiles( path, { 'projects/cs/.ai-tasks/t/open.json': '[]\n' } );
			await workspace.commit( [ 'projects/cs/.ai-tasks' ], 'State.' );
			await workspace.push();

			expect( git( remote, 'log', '-1', '--format=%s', reportBranch ).trim() ).toBe( 'State.' );
		} );
	} );
} );
