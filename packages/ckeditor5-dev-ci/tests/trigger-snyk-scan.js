/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { EventEmitter } from 'node:events';
import path from 'node:path';
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

const snykExecutablePath = path.resolve( import.meta.dirname, '..', 'node_modules', '.bin', 'snyk' );

describe( 'bin/trigger-snyk-scan', () => {
	beforeEach( () => {
		process.exitCode = undefined;

		vi.stubEnv( 'SNYK_TOKEN', 'snyk-token' );
		vi.stubEnv( 'CIRCLE_BRANCH', 'master-v54' );
		vi.mocked( spawn ).mockImplementation( () => createChildProcessThatClosesWith( 0 ) );
		vi.mocked( parseArgs ).mockReturnValue( {
			values: {
				depth: '2',
				exclude: [],
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
				snykExecutablePath,
				'config',
				'set',
				'endpoint=https://api.eu.snyk.io'
			],
			expect.objectContaining( {
				cwd: process.cwd(),
				stdio: 'inherit'
			} )
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
				snykExecutablePath,
				'config',
				'set',
				'org=org-id'
			],
			expect.objectContaining( {
				cwd: process.cwd(),
				stdio: 'inherit'
			} )
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
				snykExecutablePath,
				'code',
				'test',
				'--report',
				'--project-name=Code analysis',
				'--target-reference=master-v54'
			],
			expect.objectContaining( {
				cwd: process.cwd(),
				stdio: 'inherit'
			} )
		);
	} );

	it( 'should upload the Snyk dependency snapshot for the current branch', async () => {
		await importTriggerSnykScanScript();

		expect( vi.mocked( spawn ) ).toHaveBeenNthCalledWith(
			4,
			'pnpm',
			[
				'--silent',
				'exec',
				snykExecutablePath,
				'monitor',
				'--all-projects',
				'--exclude=node_modules,external,release,scripts,tests',
				'--detection-depth=2',
				'--target-reference=master-v54'
			],
			expect.objectContaining( {
				cwd: process.cwd(),
				stdio: 'inherit'
			} )
		);
	} );

	it( 'should merge user-provided exclusions with the defaults', async () => {
		vi.mocked( parseArgs ).mockReturnValue( {
			values: {
				depth: '2',
				exclude: [ 'fixtures' ],
				organization: 'org-id'
			}
		} );

		await importTriggerSnykScanScript();

		expect( vi.mocked( spawn ) ).toHaveBeenNthCalledWith(
			4,
			'pnpm',
			expect.arrayContaining( [ '--exclude=node_modules,external,release,scripts,tests,fixtures' ] ),
			expect.any( Object )
		);
	} );

	it( 'should not duplicate exclusions already present in defaults', async () => {
		vi.mocked( parseArgs ).mockReturnValue( {
			values: {
				depth: '2',
				exclude: [ 'external', 'fixtures' ],
				organization: 'org-id'
			}
		} );

		await importTriggerSnykScanScript();

		expect( vi.mocked( spawn ) ).toHaveBeenNthCalledWith(
			4,
			'pnpm',
			expect.arrayContaining( [ '--exclude=node_modules,external,release,scripts,tests,fixtures' ] ),
			expect.any( Object )
		);
	} );

	it( 'should allow overriding the detection depth', async () => {
		vi.mocked( parseArgs ).mockReturnValue( {
			values: {
				depth: '5',
				exclude: [],
				organization: 'org-id'
			}
		} );

		await importTriggerSnykScanScript();

		expect( vi.mocked( spawn ) ).toHaveBeenNthCalledWith(
			4,
			'pnpm',
			expect.arrayContaining( [ '--detection-depth=5' ] ),
			expect.any( Object )
		);
	} );

	it( 'should pass the -d flag to snyk code test when DEBUG is set', async () => {
		vi.stubEnv( 'DEBUG', '1' );

		await importTriggerSnykScanScript();

		expect( vi.mocked( spawn ) ).toHaveBeenNthCalledWith(
			3,
			'pnpm',
			expect.arrayContaining( [ '-d' ] ),
			expect.any( Object )
		);
	} );

	it( 'should pass the -d flag to snyk monitor when DEBUG is set', async () => {
		vi.stubEnv( 'DEBUG', '1' );

		await importTriggerSnykScanScript();

		expect( vi.mocked( spawn ) ).toHaveBeenNthCalledWith(
			4,
			'pnpm',
			expect.arrayContaining( [ '-d' ] ),
			expect.any( Object )
		);
	} );

	it( 'should omit --silent from pnpm args for all commands when DEBUG is set', async () => {
		vi.stubEnv( 'DEBUG', '1' );

		await importTriggerSnykScanScript();

		const allCalls = vi.mocked( spawn ).mock.calls;

		for ( const [ , args ] of allCalls ) {
			expect( args ).not.toContain( '--silent' );
		}
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
