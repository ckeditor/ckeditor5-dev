/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { EventEmitter } from 'node:events';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock( 'node:child_process', () => ( {
	spawn: vi.fn()
} ) );

vi.mock( 'node:url', () => ( {
	default: {
		fileURLToPath: vi.fn().mockReturnValue( '/mocked/snyk/bin/snyk' )
	}
} ) );

import { spawn } from 'node:child_process';
import url from 'node:url';
import runSnykCommand from '../lib/run-snyk-command.js';

const SNYK_PATH = '/mocked/snyk/bin/snyk';

describe( 'lib/run-snyk-command', () => {
	beforeEach( () => {
		vi.mocked( url.fileURLToPath ).mockReturnValue( SNYK_PATH );
		vi.mocked( spawn ).mockImplementation( () => createChildProcessThatClosesWith( 0 ) );
	} );

	it( 'should resolve the snyk executable path via fileURLToPath', async () => {
		await runSnykCommand( [ 'monitor' ] );

		expect( vi.mocked( url.fileURLToPath ) ).toHaveBeenCalledOnce();
		expect( vi.mocked( url.fileURLToPath ).mock.calls[ 0 ][ 0 ] ).toMatch( /snyk\/bin\/snyk/ );
	} );

	it( 'should spawn pnpm with --silent by default', async () => {
		await runSnykCommand( [ 'monitor' ] );

		expect( vi.mocked( spawn ) ).toHaveBeenCalledWith(
			'pnpm',
			[ '--silent', 'exec', SNYK_PATH, 'monitor' ],
			expect.objectContaining( {
				cwd: process.cwd(),
				shell: process.platform === 'win32',
				stdio: 'inherit'
			} )
		);
	} );

	it( 'should omit --silent when DEBUG is set', async () => {
		vi.stubEnv( 'DEBUG', '1' );

		await runSnykCommand( [ 'monitor' ] );

		expect( vi.mocked( spawn ) ).toHaveBeenCalledWith(
			'pnpm',
			[ 'exec', SNYK_PATH, 'monitor' ],
			expect.any( Object )
		);
	} );

	it( 'should pass all snyk arguments after the executable path', async () => {
		await runSnykCommand( [ 'code', 'test', '--report', '--project-name=foo' ] );

		expect( vi.mocked( spawn ) ).toHaveBeenCalledWith(
			'pnpm',
			[ '--silent', 'exec', SNYK_PATH, 'code', 'test', '--report', '--project-name=foo' ],
			expect.any( Object )
		);
	} );

	it( 'should set shell: true on Windows', async () => {
		vi.spyOn( process, 'platform', 'get' ).mockReturnValue( 'win32' );

		await runSnykCommand( [ 'monitor' ] );

		expect( vi.mocked( spawn ) ).toHaveBeenCalledWith(
			'pnpm',
			expect.any( Array ),
			expect.objectContaining( { shell: true } )
		);
	} );

	it( 'should set shell: false on non-Windows', async () => {
		vi.spyOn( process, 'platform', 'get' ).mockReturnValue( 'linux' );

		await runSnykCommand( [ 'monitor' ] );

		expect( vi.mocked( spawn ) ).toHaveBeenCalledWith(
			'pnpm',
			expect.any( Array ),
			expect.objectContaining( { shell: false } )
		);
	} );

	it( 'should resolve when the process exits with an allowed exit code', async () => {
		vi.mocked( spawn ).mockImplementation( () => createChildProcessThatClosesWith( 0 ) );

		await expect( runSnykCommand( [ 'monitor' ] ) ).resolves.toBeUndefined();
	} );

	it( 'should resolve when a non-zero allowed exit code is returned', async () => {
		vi.mocked( spawn ).mockImplementation( () => createChildProcessThatClosesWith( 1 ) );

		await expect( runSnykCommand( [ 'code', 'test' ], [ 0, 1 ] ) ).resolves.toBeUndefined();
	} );

	it( 'should reject when the process exits with a disallowed exit code', async () => {
		vi.mocked( spawn ).mockImplementation( () => createChildProcessThatClosesWith( 2 ) );

		await expect( runSnykCommand( [ 'monitor' ] ) ).rejects.toThrow(
			'Snyk command failed with exit code 2.'
		);
	} );

	it( 'should default to allowing only exit code 0', async () => {
		vi.mocked( spawn ).mockImplementation( () => createChildProcessThatClosesWith( 1 ) );

		await expect( runSnykCommand( [ 'monitor' ] ) ).rejects.toThrow(
			'Snyk command failed with exit code 1.'
		);
	} );

	it( 'should reject when the child process emits an error event', async () => {
		const error = new Error( 'spawn error' );

		vi.mocked( spawn ).mockImplementation( () => createChildProcessThatErrorsWith( error ) );

		await expect( runSnykCommand( [ 'monitor' ] ) ).rejects.toThrow( 'spawn error' );
	} );
} );

function createChildProcessThatClosesWith( exitCode ) {
	const childProcess = new EventEmitter();

	queueMicrotask( () => {
		childProcess.emit( 'close', exitCode );
	} );

	return childProcess;
}

function createChildProcessThatErrorsWith( error ) {
	const childProcess = new EventEmitter();

	queueMicrotask( () => {
		childProcess.emit( 'error', error );
	} );

	return childProcess;
}
