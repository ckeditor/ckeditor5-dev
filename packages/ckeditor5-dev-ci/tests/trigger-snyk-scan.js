/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock( 'node:util', () => ( {
	parseArgs: vi.fn()
} ) );

vi.mock( '../lib/run-snyk-command.js', () => ( {
	default: vi.fn()
} ) );

import { parseArgs } from 'node:util';
import runSnykCommand from '../lib/run-snyk-command.js';

describe( 'bin/trigger-snyk-scan', () => {
	beforeEach( () => {
		process.exitCode = undefined;

		vi.stubEnv( 'SNYK_TOKEN', 'snyk-token' );
		vi.stubEnv( 'CIRCLE_BRANCH', 'master-v54' );
		vi.mocked( runSnykCommand ).mockResolvedValue( undefined );
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

		expect( vi.mocked( runSnykCommand ) ).toHaveBeenNthCalledWith(
			1,
			[ 'config', 'set', 'endpoint=https://api.eu.snyk.io' ]
		);
	} );

	it( 'should configure the Snyk organization', async () => {
		await importTriggerSnykScanScript();

		expect( vi.mocked( runSnykCommand ) ).toHaveBeenNthCalledWith(
			2,
			[ 'config', 'set', 'org=org-id' ]
		);
	} );

	it( 'should run the Snyk code scan for the current branch', async () => {
		await importTriggerSnykScanScript();

		expect( vi.mocked( runSnykCommand ) ).toHaveBeenNthCalledWith(
			3,
			[
				'code',
				'test',
				'--report',
				'--project-name=Code analysis',
				'--target-reference=master-v54'
			],
			[ 0, 1 ]
		);
	} );

	it( 'should upload the Snyk dependency snapshot for the current branch', async () => {
		await importTriggerSnykScanScript();

		expect( vi.mocked( runSnykCommand ) ).toHaveBeenNthCalledWith(
			4,
			[
				'monitor',
				'--all-projects',
				'--exclude=node_modules,external,release,scripts,tests',
				'--detection-depth=2',
				'--target-reference=master-v54'
			],
			[ 0 ]
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

		expect( vi.mocked( runSnykCommand ) ).toHaveBeenNthCalledWith(
			4,
			expect.arrayContaining( [ '--exclude=node_modules,external,release,scripts,tests,fixtures' ] ),
			expect.any( Array )
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

		expect( vi.mocked( runSnykCommand ) ).toHaveBeenNthCalledWith(
			4,
			expect.arrayContaining( [ '--exclude=node_modules,external,release,scripts,tests,fixtures' ] ),
			expect.any( Array )
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

		expect( vi.mocked( runSnykCommand ) ).toHaveBeenNthCalledWith(
			4,
			expect.arrayContaining( [ '--detection-depth=5' ] ),
			expect.any( Array )
		);
	} );

	it( 'should pass the -d flag to snyk code test when DEBUG is set', async () => {
		vi.stubEnv( 'DEBUG', '1' );

		await importTriggerSnykScanScript();

		expect( vi.mocked( runSnykCommand ) ).toHaveBeenNthCalledWith(
			3,
			expect.arrayContaining( [ '-d' ] ),
			expect.any( Array )
		);
	} );

	it( 'should pass the -d flag to snyk monitor when DEBUG is set', async () => {
		vi.stubEnv( 'DEBUG', '1' );

		await importTriggerSnykScanScript();

		expect( vi.mocked( runSnykCommand ) ).toHaveBeenNthCalledWith(
			4,
			expect.arrayContaining( [ '-d' ] ),
			expect.any( Array )
		);
	} );

	it( 'should allow exit code 1 for the Snyk code snapshot step', async () => {
		await importTriggerSnykScanScript();

		expect( vi.mocked( runSnykCommand ) ).toHaveBeenNthCalledWith(
			3,
			expect.any( Array ),
			[ 0, 1 ]
		);
	} );

	it( 'should pass the branch name to Snyk as the target reference', async () => {
		const branchName = 'feature/Foo Bar_baz';

		vi.stubEnv( 'CIRCLE_BRANCH', branchName );

		await importTriggerSnykScanScript();

		expect( vi.mocked( runSnykCommand ) ).toHaveBeenNthCalledWith(
			3,
			expect.arrayContaining( [ `--target-reference=${ branchName }` ] ),
			expect.any( Array )
		);

		expect( vi.mocked( runSnykCommand ) ).toHaveBeenNthCalledWith(
			4,
			expect.arrayContaining( [ `--target-reference=${ branchName }` ] ),
			expect.any( Array )
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
		expect( vi.mocked( runSnykCommand ) ).not.toHaveBeenCalled();
	} );

	it( 'should set exit code when a command rejects', async () => {
		vi.mocked( runSnykCommand ).mockRejectedValueOnce( new Error( 'Snyk command failed with exit code 2.' ) );

		const consoleErrorSpy = vi.spyOn( console, 'error' ).mockImplementation( () => {} );

		await importTriggerSnykScanScript();

		expect( consoleErrorSpy ).toHaveBeenCalledOnce();
		expect( consoleErrorSpy.mock.calls[ 0 ][ 0 ] ).toMatchObject( {
			message: 'Snyk command failed with exit code 2.'
		} );
		expect( process.exitCode ).toBe( 1 );
	} );
} );

async function importTriggerSnykScanScript() {
	vi.resetModules();

	return import( '../bin/trigger-snyk-scan.js' );
}
