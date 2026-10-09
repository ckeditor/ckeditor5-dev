/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-disable @stylistic/max-len */

import { afterEach, describe, it, expect, vi } from 'vitest';
import { existsSync } from 'node:fs';
import upath from 'upath';
import { createTaskContext, createWritableTaskContext, resolveInside } from '../../src/runner/createcontext.js';
import { hash, normalise } from '../../src/utils/text.js';
import { createTempDirectory, readText, removeTempDirectories, writeFiles } from '../_utils/files.js';
import type { Agent } from '../../src/types.js';

describe( 'task contexts', () => {
	afterEach( removeTempDirectories );

	const agent: Agent = { run: vi.fn() };
	const log = vi.fn();

	describe( 'createTaskContext()', () => {
		it( 'exposes the phase, options, agent, log and text helpers', async () => {
			const root = await createTempDirectory();
			const ctx = createTaskContext( { root, phase: 'judge', options: { a: 1 }, agent, log } );

			expect( ctx ).toMatchObject( { phase: 'judge', options: { a: 1 }, agent, log, normalise, hash } );
			expect( ctx.repo.root ).toBe( root );
			expect( ctx.repo ).not.toHaveProperty( 'write' );
			expect( ctx ).not.toHaveProperty( 'exec' );
		} );

		it( 'repo.list() returns sorted relative paths of files and skips `node_modules`, dotfiles and ignored files', async () => {
			const root = await createTempDirectory();

			await writeFiles( root, {
				'docs/b.md': '',
				'docs/a.md': '',
				'docs/sub/c.md': '',
				'docs/.hidden.md': '',
				'docs/node_modules/x.md': '',
				'docs/skip/d.md': ''
			} );

			const ctx = createTaskContext( { root, phase: 'judge', options: {}, agent, log } );

			expect( await ctx.repo.list( [ 'docs/**/*.md' ], { ignore: [ 'docs/skip/**' ] } ) ).toEqual( [ 'docs/a.md', 'docs/b.md', 'docs/sub/c.md' ] );
			expect( await ctx.repo.list( [ 'docs/a.md', 'docs/skip/*.md' ] ) ).toEqual( [ 'docs/a.md', 'docs/skip/d.md' ] );
			// Directories that match a pattern are not files.
			expect( await ctx.repo.list( [ 'docs/*' ] ) ).toEqual( [ 'docs/a.md', 'docs/b.md' ] );
		} );

		it( 'repo.read() reads a file and rejects paths outside of the root', async () => {
			const root = await createTempDirectory();

			await writeFiles( root, { 'a.md': 'Content.' } );

			const ctx = createTaskContext( { root, phase: 'judge', options: {}, agent, log } );

			expect( await ctx.repo.read( 'a.md' ) ).toBe( 'Content.' );
			await expect( ctx.repo.read( '../x.md' ) ).rejects.toThrow( 'The "../x.md" path is outside of the target root.' );
		} );
	} );

	describe( 'createWritableTaskContext()', () => {
		it( 'repo.write() creates directories and repo.remove() deletes files', async () => {
			const root = await createTempDirectory();
			const ctx = createWritableTaskContext( { root, phase: 'fix', options: {}, agent, log } );

			await ctx.repo.write( 'nested/dir/a.md', 'New.' );

			expect( await readText( upath.join( root, 'nested/dir/a.md' ) ) ).toBe( 'New.' );
			expect( await ctx.repo.read( 'nested/dir/a.md' ) ).toBe( 'New.' );

			await ctx.repo.remove( 'nested/dir/a.md' );
			await ctx.repo.remove( 'missing.md' );

			expect( existsSync( upath.join( root, 'nested/dir/a.md' ) ) ).toBe( false );
			await expect( ctx.repo.write( '../x.md', '' ) ).rejects.toThrow( 'outside of the target root' );
		} );

		it( 'exec() runs a command in the root and returns its output', async () => {
			const root = await createTempDirectory();
			const ctx = createWritableTaskContext( { root, phase: 'verify', options: {}, agent, log } );

			const result = await ctx.exec( process.execPath, [ '-e', 'console.log( process.cwd() ); console.error( "err" );' ] );

			expect( result.output ).toContain( 'err' );
			expect( result.output ).toContain( upath.basename( root ) );
			expect( ( await ctx.exec( process.execPath, [ '-e', '' ] ) ).output ).toBe( '' );
		} );

		it( 'exec() throws with the tail of the output when the command fails', async () => {
			const root = await createTempDirectory();
			const ctx = createWritableTaskContext( { root, phase: 'verify', options: {}, agent, log } );

			const error = await ctx.exec( process.execPath, [ '-e', 'process.stdout.write( "x".repeat( 5000 ) + "END" ); process.exit( 3 );' ] )
				.catch( ( error: Error ) => error );

			expect( ( error as Error ).message ).toMatch( /exited with code 3:\nx+END$/ );
			expect( ( error as Error ).message.length ).toBeLessThan( 4200 );
		} );

		it( 'exec() keeps a character whole when it is split between two chunks of the output', async () => {
			const root = await createTempDirectory();
			const ctx = createWritableTaskContext( { root, phase: 'verify', options: {}, agent, log } );
			const script = 'process.stdout.write( Buffer.from( [ 0xe2, 0x80 ] ) ); setTimeout( () => process.stdout.write( Buffer.from( [ 0x94 ] ) ), 50 );';

			expect( ( await ctx.exec( process.execPath, [ '-e', script ] ) ).output ).toBe( '—' );
		} );

		it( 'exec() throws when the command takes longer than the timeout', async () => {
			const root = await createTempDirectory();
			const ctx = createWritableTaskContext( { root, phase: 'verify', options: {}, agent, log } );

			await expect( ctx.exec( process.execPath, [ '-e', 'setTimeout( () => {}, 10000 );' ], { timeout: 100 } ) )
				.rejects.toThrow( /did not finish within 100 ms/ );
		} );

		it( 'exec() throws when the command is stopped by a signal', async () => {
			const root = await createTempDirectory();
			const ctx = createWritableTaskContext( { root, phase: 'verify', options: {}, agent, log } );

			await expect( ctx.exec( process.execPath, [ '-e', 'process.kill( process.pid, "SIGTERM" );' ] ) )
				.rejects.toThrow( /was stopped by SIGTERM/ );
		} );

		it( 'exec() without arguments, and a command that cannot start', async () => {
			const root = await createTempDirectory();
			const ctx = createWritableTaskContext( { root, phase: 'verify', options: {}, agent, log } );

			await expect( ctx.exec( 'command-that-does-not-exist-12345' ) ).rejects.toThrow( 'ENOENT' );
		} );
	} );

	describe( 'resolveInside()', () => {
		it( 'resolves paths inside the root and rejects the others', () => {
			expect( resolveInside( '/root', 'a/b.md' ) ).toBe( '/root/a/b.md' );
			expect( resolveInside( '/root', '/root/a.md' ) ).toBe( '/root/a.md' );
			expect( () => resolveInside( '/root', '/other/a.md' ) ).toThrow( 'The "/other/a.md" path is outside of the target root.' );
			expect( () => resolveInside( '/root', '../a.md' ) ).toThrow( 'outside of the target root' );
		} );
	} );
} );
