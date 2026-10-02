/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, it, expect, vi } from 'vitest';
import { parseArguments, parseResolveArguments, runCli } from '../src/cli.js';
import { runTasks } from '../src/runtasks.js';
import { renderResolvedFinding, resolveFinding, type ResolvedFinding } from '../src/commands/resolvefinding.js';

vi.mock( '../src/runtasks.js' );
vi.mock( '../src/commands/resolvefinding.js' );

describe( 'parseArguments()', () => {
	const cwd = '/work';

	it( 'uses the defaults', () => {
		expect( parseArguments( [], { cwd, env: {} } ) ).toEqual( {
			configPath: '/work/ai-tasks',
			cwd: '/work',
			targets: [],
			tasks: [],
			token: undefined,
			author: { name: 'CKEditor AI Tasks', email: 'ai-tasks@users.noreply.github.com' },
			buildUrl: undefined
		} );
	} );

	it( 'parses a local run and splits lists', () => {
		const options = parseArguments( [
			'--config', 'cfg', '--cwd', 'repo/sub', '--target', 'a,b', '--target', 'b', '--task', ' x , ,y '
		], { cwd, env: {} } );

		expect( options ).toMatchObject( {
			configPath: '/work/cfg',
			cwd: '/work/repo/sub',
			targets: [ 'a', 'b' ],
			tasks: [ 'x', 'y' ],
			token: undefined
		} );
	} );

	it( 'parses a published run and reads the environment', () => {
		const options = parseArguments( [ '--publish' ], {
			cwd,
			env: {
				AI_TASKS_GITHUB_TOKEN: 'secret',
				AI_TASKS_GIT_NAME: 'Bot',
				AI_TASKS_GIT_EMAIL: 'bot@example.com',
				AI_TASKS_BUILD_URL: 'https://ci.example.com/build/1'
			}
		} );

		expect( options ).toMatchObject( {
			token: 'secret',
			author: { name: 'Bot', email: 'bot@example.com' },
			buildUrl: 'https://ci.example.com/build/1'
		} );
	} );

	it( 'does not read the build URL from CI-specific variables', () => {
		expect( parseArguments( [], { cwd, env: { CIRCLE_BUILD_URL: 'https://circle', GITHUB_RUN_ID: '1' } } ).buildUrl )
			.toBeUndefined();
	} );

	it( 'uses `process.cwd()` and `process.env` by default', () => {
		vi.stubEnv( 'AI_TASKS_GITHUB_TOKEN', 'from-env' );

		const options = parseArguments( [ '--publish' ] );
		const workingDirectory = process.cwd().replace( /\\/g, '/' );

		expect( options.configPath ).toBe( `${ workingDirectory }/ai-tasks` );
		expect( options.cwd ).toBe( workingDirectory );
		expect( options.token ).toBe( 'from-env' );
	} );

	it.each( [
		[ [ '--publish' ], {}, 'A published run needs a GitHub token in the "AI_TASKS_GITHUB_TOKEN" environment variable.' ],
		[ [ '--branch', 'x' ], {}, 'Unknown option \'--branch\'' ],
		[ [ '--repo-root', 'x' ], {}, 'Unknown option \'--repo-root\'' ],
		[ [ '--output', 'x' ], {}, 'Unknown option \'--output\'' ],
		[ [ '--workspace', 'x' ], {}, 'Unknown option \'--workspace\'' ],
		[ [ '--unknown' ], {}, 'Unknown option \'--unknown\'' ]
	] )( 'rejects %j', ( args, env, message ) => {
		expect( () => parseArguments( args, { cwd, env } ) ).toThrow( message );
	} );
} );

describe( 'parseResolveArguments()', () => {
	const cwd = '/work';

	it( 'parses `reject` with the defaults', () => {
		expect( parseResolveArguments( [ 'reject', 'f3a9c1', '--reason', 'Fine.' ], { cwd } ) ).toEqual( {
			action: 'reject',
			id: 'f3a9c1',
			reason: 'Fine.',
			force: false,
			configPath: '/work/ai-tasks',
			cwd: '/work',
			targets: [],
			tasks: []
		} );
	} );

	it( 'parses `dismiss` with every option', () => {
		expect( parseResolveArguments( [
			'dismiss', 'f3a9', '--force', '--config', 'cfg', '--cwd', 'repo', '--target', 'a,b', '--task', 'x'
		], { cwd } ) ).toEqual( {
			action: 'dismiss',
			id: 'f3a9',
			reason: undefined,
			force: true,
			configPath: '/work/cfg',
			cwd: '/work/repo',
			targets: [ 'a', 'b' ],
			tasks: [ 'x' ]
		} );
	} );

	it( 'uses `process.cwd()` by default', () => {
		vi.spyOn( process, 'cwd' ).mockReturnValue( '/current' );

		expect( parseResolveArguments( [ 'dismiss', 'f3a9' ] ) ).toMatchObject( { configPath: '/current/ai-tasks', cwd: '/current' } );
	} );

	it.each( [
		[ 'no command', [] ],
		[ 'an unknown command', [ 'accept', 'f3a9' ] ],
		[ 'no ID', [ 'reject' ] ],
		[ 'too many IDs', [ 'dismiss', 'a', 'b' ] ]
	] )( 'throws the usage for %s', ( _name, args ) => {
		expect( () => parseResolveArguments( args, { cwd } ) )
			.toThrow( 'Usage: ckeditor5-dev-agents reject <id> --reason "…" | ckeditor5-dev-agents dismiss <id>' );
	} );

	it( 'throws for `reject` without a reason', () => {
		expect( () => parseResolveArguments( [ 'reject', 'f3a9', '--reason', '  ' ], { cwd } ) )
			.toThrow( 'Rejecting a finding needs a reason. Pass it with "--reason".' );
	} );

	it( 'throws for `--reason` with `dismiss`', () => {
		expect( () => parseResolveArguments( [ 'dismiss', 'f3a9', '--reason', 'x' ], { cwd } ) )
			.toThrow( 'The "--reason" argument works only with "reject". A dismissed finding has no decision.' );
	} );

	it( 'throws for unknown options', () => {
		expect( () => parseResolveArguments( [ 'dismiss', 'f3a9', '--publish' ], { cwd } ) ).toThrow( /Unknown option '--publish'/ );
	} );
} );

describe( 'runCli()', () => {
	beforeEach( () => {
		vi.spyOn( console, 'error' ).mockImplementation( () => {} );
		vi.spyOn( console, 'log' ).mockImplementation( () => {} );
	} );

	it( 'returns 0 when the run is ok and prints the summary', async () => {
		vi.mocked( runTasks ).mockResolvedValue( {
			ok: true,
			targets: [ { target: 'docs', branch: 'stable', publish: false, results: [] } ]
		} );

		expect( await runCli( [ '--', '--config', 'cfg' ] ) ).toBe( 0 );
		expect( runTasks ).toHaveBeenCalledWith( expect.objectContaining( { configPath: expect.stringMatching( /\/cfg$/ ) } ) );
		// The summary comes after the progress logs, separated by an empty line.
		expect( console.log ).toHaveBeenCalledWith( '\ndocs (stable) · no enabled tasks' );
		expect( console.error ).not.toHaveBeenCalled();
	} );

	it( 'returns 1 when the run is not ok', async () => {
		vi.mocked( runTasks ).mockResolvedValue( { ok: false, targets: [] } );

		expect( await runCli( [] ) ).toBe( 1 );
		expect( console.error ).toHaveBeenCalledWith( '\nSome tasks did not finish cleanly. See the problems above.' );
	} );

	it( 'returns 1 and prints the message when the run throws', async () => {
		vi.mocked( runTasks ).mockRejectedValue( new Error( 'Broken config.' ) );

		expect( await runCli( [] ) ).toBe( 1 );
		expect( console.error ).toHaveBeenCalledWith( 'Broken config.' );
	} );

	it( 'returns 1 when the arguments are invalid', async () => {
		expect( await runCli( [ '--output', 'x' ] ) ).toBe( 1 );
		expect( runTasks ).not.toHaveBeenCalled();
	} );
	describe( '`reject` and `dismiss`', () => {
		const result: ResolvedFinding = {
			action: 'reject',
			target: 'repo',
			finding: {
				fingerprint: 't|a|R1|', id: 'abc123', task: 't', unit: 'a', ruleId: 'R1', discriminator: '', detail: 'Bad.', fragment: 'x'
			},
			revertedFiles: [],
			reopened: []
		};

		it( 'resolves the finding, prints what was done, and returns 0', async () => {
			vi.mocked( resolveFinding ).mockResolvedValue( result );
			vi.mocked( renderResolvedFinding ).mockReturnValue( 'Rejected [f3a9c1].' );

			expect( await runCli( [ 'reject', 'f3a9c1', '--reason', 'Fine.' ] ) ).toBe( 0 );
			expect( resolveFinding ).toHaveBeenCalledWith( expect.objectContaining( { action: 'reject', id: 'f3a9c1', reason: 'Fine.' } ) );
			expect( renderResolvedFinding ).toHaveBeenCalledWith( result );
			expect( console.log ).toHaveBeenCalledWith( 'Rejected [f3a9c1].' );
			expect( runTasks ).not.toHaveBeenCalled();
		} );

		it( 'accepts a leading `--` separator', async () => {
			vi.mocked( resolveFinding ).mockResolvedValue( result );

			expect( await runCli( [ '--', 'dismiss', 'f3a9c1' ] ) ).toBe( 0 );
			expect( resolveFinding ).toHaveBeenCalledWith( expect.objectContaining( { action: 'dismiss', id: 'f3a9c1' } ) );
		} );

		it( 'prints the error and returns 1 when resolving fails', async () => {
			vi.mocked( resolveFinding ).mockRejectedValue( new Error( 'Re-run with "--force".' ) );

			expect( await runCli( [ 'dismiss', 'f3a9c1' ] ) ).toBe( 1 );
			expect( console.error ).toHaveBeenCalledWith( 'Re-run with "--force".' );
		} );

		it( 'prints the error and returns 1 for invalid arguments', async () => {
			expect( await runCli( [ 'dismiss', 'f3a9c1', '--reason', 'x' ] ) ).toBe( 1 );
			expect( resolveFinding ).not.toHaveBeenCalled();
			expect( console.error ).toHaveBeenCalledWith( expect.stringContaining( 'works only with "reject"' ) );
		} );
	} );
} );
