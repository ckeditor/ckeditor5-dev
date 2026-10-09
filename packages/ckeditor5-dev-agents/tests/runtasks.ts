/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-disable @stylistic/max-len */

import { afterEach, beforeEach, describe, it, expect, vi, type Mock } from 'vitest';
import { runTasks, type RunTasksOptions } from '../src/runtasks.js';
import { runTarget, type TaskResult } from '../src/runner/runtarget.js';
import { openWorkspace, type GitWorkspace } from '../src/git/gitworkspace.js';
import { createGitHubClient, type GitHubClient } from '../src/github/githubclient.js';
import { createTempDirectory, removeTempDirectories, writeFiles } from './_utils/files.js';
import type { Target, TaskSummary } from '../src/types.js';

vi.mock( '../src/runner/runtarget.js' );
vi.mock( '../src/git/gitworkspace.js' );
vi.mock( '../src/github/githubclient.js' );

const TASK = 'export default { id: \'ID\', title: \'Task ID\', ruleIds: [ \'R1\' ], scope() { return []; }, ' +
	'contentHash() { return \'x\'; }, payload() {}, judge() { return []; } };\n';

describe( 'runTasks()', () => {
	let configPath: string;
	let log: Mock<( message: string ) => void>;
	let workspace: GitWorkspace;

	const summary = ( overrides: Partial<TaskSummary> = {} ): TaskSummary => ( {
		task: 'meta',
		title: 'Meta',
		units: 0,
		changed: 0,
		judged: 0,
		deferred: 0,
		newFindings: 0,
		alreadyOpen: 0,
		rejected: 0,
		fixed: 0,
		discarded: 0,
		changedFiles: 0,
		open: 0,
		errors: 0,
		problems: [],
		cost: 0,
		tokens: 0,
		...overrides
	} );

	const result = ( overrides: Partial<TaskResult> = {} ): TaskResult => ( {
		task: 'meta',
		title: 'Meta',
		summary: summary(),
		durationMs: 5,
		...overrides
	} );

	beforeEach( async () => {
		configPath = await createTempDirectory();
		log = vi.fn<( message: string ) => void>();

		// Two targets live in the same repository, the third one in another.
		await writeFiles( configPath, {
			'tasks/meta/index.js': TASK.replaceAll( 'ID', 'meta' ),
			'tasks/bluf/index.js': TASK.replaceAll( 'ID', 'bluf' ),
			'targets/cs.js': 'export default { slug: \'owner/docs\', root: \'projects/cs\', tasks: { meta: {} } };\n',
			'targets/ckfinder.js': 'export default { slug: \'owner/docs\', root: \'projects/ckfinder\', tasks: { meta: {}, bluf: {} } };\n',
			'targets/ckbox.js': 'export default { slug: \'owner/ckbox\', tasks: { bluf: {} } };\n'
		} );

		workspace = {
			path: '/checkout',
			branch: 'stable',
			originSlug: 'owner/docs',
			assertPublishable: vi.fn(),
			checkoutReportBranch: vi.fn(),
			commit: vi.fn(),
			push: vi.fn(),
			returnToBase: vi.fn(),
			refExists: vi.fn(),
			hasChanges: vi.fn(),
			restore: vi.fn()
		};

		vi.mocked( openWorkspace ).mockImplementation( async () => workspace );
		vi.mocked( runTarget ).mockResolvedValue( [ result() ] );
	} );

	afterEach( removeTempDirectories );

	const author = { name: 'CKEditor AI Tasks', email: 'ai-tasks@users.noreply.github.com' };
	const run = ( overrides: Partial<RunTasksOptions> = {} ) => runTasks( {
		configPath, cwd: '/checkout/projects', targets: [], tasks: [], author, log, ...overrides
	} );

	it( 'runs the targets of the repository the checkout is a clone of', async () => {
		const output = await run();

		expect( output ).toEqual( {
			ok: true,
			targets: [
				{ target: 'ckfinder', branch: 'stable', publish: false, results: [ result() ] },
				{ target: 'cs', branch: 'stable', publish: false, results: [ result() ] }
			]
		} );

		expect( openWorkspace ).toHaveBeenCalledWith( { cwd: '/checkout/projects', author } );
		expect( workspace.assertPublishable ).not.toHaveBeenCalled();

		const [ [ ckfinder ], [ cs ] ] = vi.mocked( runTarget ).mock.calls as unknown as [ [ Record<string, unknown> ], [ Record<string, unknown> ] ];

		expect( ckfinder ).toMatchObject( {
			workspace,
			taskIds: [],
			github: undefined,
			buildUrl: undefined,
			today: expect.stringMatching( /^\d{4}-\d{2}-\d{2}$/ ),
			target: expect.objectContaining( { name: 'ckfinder', root: 'projects/ckfinder' } )
		} );
		expect( [ ...( ckfinder.target as Target ).tasks.values() ].map( instance => instance.task.id ) ).toEqual( [ 'meta', 'bluf' ] );
		expect( cs ).toMatchObject( { target: expect.objectContaining( { name: 'cs' } ) } );
		expect( log.mock.calls ).toEqual( [
			[ '\n○ Running "ckfinder" (owner/docs, stable)...' ],
			[ '\n○ Running "cs" (owner/docs, stable)...' ]
		] );

		// The progress of a target is indented under its heading.
		( cs.log as ( message: string ) => void )( 'Message.' );

		expect( log ).toHaveBeenLastCalledWith( '  Message.' );
	} );

	it( 'reports the branch of a detached checkout as `HEAD`', async () => {
		workspace.branch = 'HEAD';

		const output = await run();

		expect( output.targets[ 0 ]!.branch ).toBe( 'HEAD' );
		expect( log ).toHaveBeenCalledWith( '\n○ Running "ckfinder" (owner/docs, HEAD)...' );
	} );

	it( 'runs the requested targets and tasks', async () => {
		await run( { targets: [ 'cs' ], tasks: [ 'meta' ] } );

		expect( runTarget ).toHaveBeenCalledOnce();
		expect( vi.mocked( runTarget ).mock.calls[ 0 ]![ 0 ] ).toMatchObject( { target: expect.objectContaining( { name: 'cs' } ), taskIds: [ 'meta' ] } );
	} );

	it( 'checks the checkout and creates the GitHub client for a published run', async () => {
		const client: GitHubClient = {
			findOpenPullRequest: vi.fn(),
			createPullRequest: vi.fn(),
			updatePullRequest: vi.fn(),
			createComment: vi.fn()
		};

		vi.mocked( createGitHubClient ).mockReturnValue( client );

		const output = await run( { token: 'secret', buildUrl: 'https://ci' } );

		expect( output.targets[ 0 ]!.publish ).toBe( true );
		expect( workspace.assertPublishable ).toHaveBeenCalledExactlyOnceWith( [
			'projects/ckfinder/.ai-tasks/meta/open.json',
			'projects/ckfinder/.ai-tasks/bluf/open.json',
			'projects/cs/.ai-tasks/meta/open.json'
		] );
		expect( createGitHubClient ).toHaveBeenCalledWith( 'secret' );
		expect( vi.mocked( runTarget ).mock.calls[ 0 ]![ 0 ] ).toMatchObject( { github: client, buildUrl: 'https://ci' } );
	} );

	it( 'throws when the checkout cannot be published from', async () => {
		vi.mocked( workspace.assertPublishable ).mockRejectedValue( new Error( 'Publishing needs a clean working tree.' ) );

		await expect( run( { token: 'secret' } ) ).rejects.toThrow( 'Publishing needs a clean working tree.' );
		expect( runTarget ).not.toHaveBeenCalled();
	} );

	it( 'throws for a target that does not exist', async () => {
		await expect( run( { targets: [ 'nope' ] } ) ).rejects.toThrow( 'The "nope" target does not exist. Available targets: ckbox, ckfinder, cs.' );
	} );

	it( 'throws for a requested target of another repository', async () => {
		await expect( run( { targets: [ 'cs', 'ckbox' ] } ) )
			.rejects.toThrow( 'The "ckbox" target is for "owner/ckbox", but the checkout is a clone of owner/docs.' );
	} );

	it( 'throws when no target is configured for the repository of the checkout', async () => {
		workspace.originSlug = 'owner/other';

		await expect( run() ).rejects.toThrow( 'No target is configured for the checkout, which is a clone of owner/other.' );
	} );

	it( 'throws when the repository of the checkout is unknown', async () => {
		workspace.originSlug = undefined;

		await expect( run() ).rejects.toThrow( 'No target is configured for the checkout, which is a clone of an unknown repository.' );
		await expect( run( { targets: [ 'cs' ] } ) )
			.rejects.toThrow( 'The "cs" target is for "owner/docs", but the checkout is a clone of an unknown repository.' );
	} );

	it( 'throws for a task that is not configured in the selected targets', async () => {
		await expect( run( { targets: [ 'cs' ], tasks: [ 'bluf' ] } ) )
			.rejects.toThrow( 'The "bluf" task is not configured in any of the selected targets.' );
	} );

	it( 'is not ok when a task failed', async () => {
		vi.mocked( runTarget ).mockResolvedValue( [ result( { summary: undefined, failure: 'x' } ) ] );

		expect( ( await run() ).ok ).toBe( false );
	} );

	it( 'is not ok when a unit failed', async () => {
		vi.mocked( runTarget ).mockResolvedValue( [ result( { summary: summary( { errors: 1 } ) } ) ] );

		expect( ( await run() ).ok ).toBe( false );
	} );

	it( 'records a failing target, continues with the next one and is not ok', async () => {
		vi.mocked( runTarget ).mockRejectedValueOnce( new Error( 'No root.' ) );

		const output = await run();

		expect( output.ok ).toBe( false );
		expect( output.targets[ 0 ] ).toEqual( {
			target: 'ckfinder', branch: 'stable', publish: false, results: [], error: 'No root.'
		} );
		expect( output.targets[ 1 ]!.error ).toBeUndefined();
		expect( log.mock.calls ).toEqual( [
			[ '\n○ Running "ckfinder" (owner/docs, stable)...' ],
			[ '  Running "ckfinder" failed: No root.' ],
			[ '\n○ Running "cs" (owner/docs, stable)...' ]
		] );
	} );

	it( 'logs to the console by default', async () => {
		vi.spyOn( console, 'log' ).mockImplementation( () => {} );

		await runTasks( { configPath, cwd: '/checkout', targets: [ 'cs' ], tasks: [], author } );

		expect( console.log ).toHaveBeenCalledWith( '\n○ Running "cs" (owner/docs, stable)...' );

		( vi.mocked( runTarget ).mock.calls[ 0 ]![ 0 ].log )( 'From a task.' );

		expect( console.log ).toHaveBeenLastCalledWith( '  From a task.' );
	} );
} );
