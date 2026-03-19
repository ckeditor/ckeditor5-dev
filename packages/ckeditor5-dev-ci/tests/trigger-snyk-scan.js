/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { EventEmitter } from 'node:events';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock( 'node:child_process', () => ( {
	spawn: vi.fn()
} ) );

vi.mock( 'node:util', () => ( {
	parseArgs: vi.fn()
} ) );

import { spawn } from 'node:child_process';
import { parseArgs } from 'node:util';
import runSnykCommand from '../lib/run-snyk-command.js';

describe( 'bin/trigger-snyk-scan', () => {
	beforeEach( () => {
		process.exitCode = undefined;

		vi.stubEnv( 'SNYK_TOKEN', 'snyk-token' );
		vi.stubEnv( 'CIRCLE_BRANCH', 'master-v54' );
		vi.mocked( spawn ).mockImplementation( () => createChildProcessThatClosesWith( 0 ) );
		vi.mocked( parseArgs ).mockReturnValue( {
			values: {
				organization: 'org-id'
			}
		} );
	} );

	it( 'should configure the Snyk endpoint', async () => {
		await importTriggerSnykScanScript();

		expect( vi.mocked( spawn ) ).toHaveBeenNthCalledWith(
			1,
			'pnpm',
			[
				'--silent',
				'exec',
				'snyk',
				'config',
				'set',
				'endpoint=https://api.eu.snyk.io'
			],
			{
				cwd: process.cwd(),
				stdio: 'inherit'
			}
		);
	} );

	it( 'should configure the Snyk organization', async () => {
		await importTriggerSnykScanScript();

		expect( vi.mocked( spawn ) ).toHaveBeenNthCalledWith(
			2,
			'pnpm',
			[
				'--silent',
				'exec',
				'snyk',
				'config',
				'set',
				'org=org-id'
			],
			{
				cwd: process.cwd(),
				stdio: 'inherit'
			}
		);
	} );

	it( 'should run the Snyk code scan for the current branch', async () => {
		await importTriggerSnykScanScript();

		expect( vi.mocked( spawn ) ).toHaveBeenNthCalledWith(
			3,
			'pnpm',
			[
				'--silent',
				'exec',
				'snyk',
				'code',
				'test',
				'--report',
				'--project-name=Code analysis',
				'--target-reference=master-v54'
			],
			{
				cwd: process.cwd(),
				stdio: 'inherit'
			}
		);
	} );

	it( 'should upload the Snyk dependency snapshot for the current branch', async () => {
		vi.mocked( spawn )
			.mockImplementationOnce( () => createChildProcessThatClosesWith( 0 ) )
			.mockImplementationOnce( () => createChildProcessThatClosesWith( 0 ) )
			.mockImplementationOnce( () => createChildProcessThatClosesWith( 0 ) )
			.mockImplementationOnce( () => createChildProcessThatClosesWith( 0 ) );

		await importTriggerSnykScanScript();

		expect( vi.mocked( spawn ) ).toHaveBeenNthCalledWith(
			4,
			'pnpm',
			[
				'--silent',
				'exec',
				'snyk',
				'monitor',
				'--all-projects',
				'--exclude=external,tests',
				'--target-reference=master-v54'
			],
			{
				cwd: process.cwd(),
				stdio: 'inherit'
			}
		);
	} );

	it( 'should allow exit code 1 for the Snyk code snapshot step', async () => {
		vi.mocked( spawn )
			.mockImplementationOnce( () => createChildProcessThatClosesWith( 0 ) )
			.mockImplementationOnce( () => createChildProcessThatClosesWith( 0 ) )
			.mockImplementationOnce( () => createChildProcessThatClosesWith( 1 ) )
			.mockImplementationOnce( () => createChildProcessThatClosesWith( 0 ) );

		await importTriggerSnykScanScript();
		expect( vi.mocked( spawn ) ).toHaveBeenCalledTimes( 4 );
	} );

	it( 'should pass the branch name to Snyk as the target reference', async () => {
		const branchName = 'feature/Foo Bar_baz';

		vi.stubEnv( 'CIRCLE_BRANCH', branchName );

		await importTriggerSnykScanScript();

		expect( vi.mocked( spawn ) ).toHaveBeenNthCalledWith(
			3,
			'pnpm',
			expect.arrayContaining( [ `--target-reference=${ branchName }` ] ),
			expect.any( Object )
		);

		expect( vi.mocked( spawn ) ).toHaveBeenNthCalledWith(
			4,
			'pnpm',
			expect.arrayContaining( [ `--target-reference=${ branchName }` ] ),
			expect.any( Object )
		);
	} );

	it( 'should set exit code when the organization argument is missing', async () => {
		vi.mocked( parseArgs ).mockReturnValue( {
			values: {}
		} );

		const consoleErrorSpy = vi.spyOn( console, 'error' ).mockImplementation( () => {} );

		await importTriggerSnykScanScript();

		expect( consoleErrorSpy ).toHaveBeenCalledOnce();
		expect( consoleErrorSpy.mock.calls[ 0 ][ 0 ] ).toMatchObject( {
			message: 'Missing required argument: --organization'
		} );
		expect( process.exitCode ).toBe( 1 );
		expect( vi.mocked( spawn ) ).not.toHaveBeenCalled();
	} );

	it( 'should reject when a command exits with a disallowed code', async () => {
		vi.mocked( spawn ).mockImplementationOnce( () => createChildProcessThatClosesWith( 2 ) );

		await expect( runSnykCommand( [ 'monitor' ] ) ).rejects.toThrow( 'Snyk command failed with exit code 2.' );
	} );
} );

function createChildProcessThatClosesWith( exitCode ) {
	const childProcess = new EventEmitter();

	queueMicrotask( () => {
		childProcess.emit( 'close', exitCode );
	} );

	return childProcess;
}

async function importTriggerSnykScanScript() {
	vi.resetModules();

	return import( '../bin/trigger-snyk-scan.js' );
}
