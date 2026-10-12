/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-disable @stylistic/max-len */

import { afterEach, beforeEach, describe, it, expect, vi, type Mock } from 'vitest';
import upath from 'upath';
import { getReportBranch, runTarget, type RunTargetOptions } from '../../src/runner/runtarget.js';
import type { LoadedTask } from '../../src/config/loadtasks.js';
import { openWorkspace, type GitWorkspace } from '../../src/git/gitworkspace.js';
import { readJson, readText, removeTempDirectories } from '../_utils/files.js';
import { createCheckout, createRemote, git, isolateGit, pushFiles } from '../_utils/git.js';
import type { GitHubClient } from '../../src/github/githubclient.js';
import type { Finding, Target, Task, TaskInstance, TaskOptions, TaskUnit } from '../../src/types.js';

type Payload = { content: string };

function createTask( id: string, overrides: Partial<Task<unknown, TaskUnit, Payload>> = {} ): Task {
	return {
		id,
		title: `Task ${ id }`,
		ruleIds: [ 'R1' ],
		include: [ 'docs/*.md' ],
		async scope( { repo } ) {
			return ( await repo.list( [ 'docs/*.md' ] ) ).map( path => ( { key: path, path } ) );
		},
		async contentHash( { repo, hash, unit } ) {
			return hash( await repo.read( unit.path! ) );
		},
		async payload( { repo, unit } ) {
			return { content: await repo.read( unit.path! ) };
		},
		judge: ( { payload } ) => payload.content.includes( 'BAD' ) ? [ { ruleId: 'R1', detail: 'Bad.' } ] : [],
		...overrides
	} satisfies Task<unknown, TaskUnit, Payload>;
}

function createFixingTask( id: string ): Task {
	return createTask( id, {
		writes: [ 'docs/**' ],
		async fix( { repo, unit } ) {
			await repo.write( unit.path!, ( await repo.read( unit.path! ) ).replace( 'BAD', 'GOOD' ) );
		}
	} );
}

const tasks = new Map<string, LoadedTask>( [
	[ 'meta', { task: createFixingTask( 'meta' ), directory: '/tasks/meta' } ],
	[ 'plain', { task: createTask( 'plain' ), directory: '/tasks/plain' } ],
	[ 'chatty', { task: createTask( 'chatty', { scope: ( { log } ) => {
		log( 'Hello from the task.' );

		return [];
	} } ), directory: '/tasks/chatty' } ],
	[ 'broken', { task: createTask( 'broken', { scope: () => {
		throw new Error( 'Broken scope.' );
	} } ), directory: '/tasks/broken' } ],
	[ 'throwing', { task: createTask( 'throwing', { prepare: () => {
		throw 'The token is missing.';
	} } ), directory: '/tasks/throwing' } ],
	// Without `scope()`, so its instances choose the files with `include`.
	[ 'files', { task: createTask( 'files', { scope: undefined } ), directory: '/tasks/files' } ]
] );

// An instance of the task as a target configures it, with the defaults of the framework.
function createInstance( id: string, { taskId = id, task = tasks.get( taskId )!.task, enabled = true, include = [], options = {} }: {
	taskId?: string;
	task?: Task;
	enabled?: boolean;
	include?: Array<string>;
	options?: TaskOptions;
} = {} ): TaskInstance {
	const title = id === task.id ? task.title : `${ task.title } (${ id })`;

	return {
		task: { ...task, id, title, include, exclude: [], maxUnits: 100, options },
		directory: tasks.get( taskId )!.directory,
		enabled
	};
}

function createTarget( entries: Array<[ string, boolean ] | TaskInstance>, root = '.' ): Target {
	const instances = entries.map( entry => Array.isArray( entry ) ? createInstance( entry[ 0 ], { enabled: entry[ 1 ] } ) : entry );

	return {
		name: 'x',
		slug: 'owner/repo',
		root,
		tasks: new Map( instances.map( instance => [ instance.task.id, instance ] ) )
	};
}

describe( 'getReportBranch()', () => {
	it( 'returns the branch of the task, target and base branch', () => {
		expect( getReportBranch( 'meta', { name: 'cs' }, 'stable' ) ).toBe( 'ai-tasks/meta/cs/stable' );
	} );
} );

describe( 'runTarget()', () => {
	const author = { name: 'Bot', email: 'bot@example.com' };

	let log: Mock<( message: string ) => void>;
	let remote: string;
	let seed: string;
	let checkout: string;
	let workspace: GitWorkspace;

	// The `files` task twice: on every guide, and on one guide only.
	const filesInstances = (): Array<TaskInstance> => [
		createInstance( 'files', { include: [ 'docs/*.md' ] } ),
		createInstance( 'files-b', { taskId: 'files', include: [ 'docs/b.md' ] } )
	];

	beforeEach( async () => {
		await isolateGit();

		log = vi.fn<( message: string ) => void>();
		( { remote, seed } = await createRemote( { 'docs/a.md': 'Fine.\n', 'docs/b.md': 'BAD\n' } ) );
		checkout = await createCheckout( remote );
		workspace = await openWorkspace( { cwd: checkout, author } );
	} );

	afterEach( removeTempDirectories );

	const baseOptions = ( target: Target ): RunTargetOptions => ( {
		target,
		taskIds: [],
		workspace,
		today: '2026-09-29',
		log
	} );

	const readOpen = ( taskId: string ) => readJson<Array<Finding>>( upath.join( checkout, '.ai-tasks', taskId, 'open.json' ) );

	it( 'skips a target without enabled tasks', async () => {
		const results = await runTarget( baseOptions( createTarget( [ [ 'meta', false ] ] ) ) );

		expect( results ).toEqual( [] );
		expect( log.mock.calls ).toEqual( [ [ 'No tasks are enabled for the "x" target. Skipping.' ] ] );
	} );

	it( 'throws when the root of the target does not exist in the checkout', async () => {
		await expect( runTarget( baseOptions( createTarget( [ [ 'plain', true ] ], 'projects/cs' ) ) ) )
			.rejects.toThrow( 'The root of the "x" target, "projects/cs", does not exist in the checkout.' );
	} );

	describe( 'local run', () => {
		it( 'leaves the fixes and the state in the working tree, and commits nothing', async () => {
			const head = git( checkout, 'rev-parse', 'HEAD' ).trim();
			const results = await runTarget( baseOptions( createTarget( [ [ 'meta', true ], [ 'plain', false ] ] ) ) );

			expect( results ).toEqual( [ {
				task: 'meta',
				title: 'Task meta',
				summary: expect.objectContaining( { judged: 2, fixed: 1, changedFiles: 1 } ),
				durationMs: expect.any( Number )
			} ] );
			expect( await readText( upath.join( checkout, 'docs/b.md' ) ) ).toBe( 'GOOD\n' );
			expect( ( await readOpen( 'meta' ) )[ 0 ]!.fix ).toBeDefined();
			expect( await readText( upath.join( checkout, '.ai-tasks/meta/report.md' ) ) ).toContain( '(https://github.com/owner/repo/blob/stable/docs/b.md)' );
			expect( git( checkout, 'rev-parse', 'HEAD' ).trim() ).toBe( head );
			expect( git( checkout, 'rev-parse', '--abbrev-ref', 'HEAD' ).trim() ).toBe( 'stable' );
			expect( git( remote, 'branch', '--list', 'ai-tasks/*' ).trim() ).toBe( '' );
			expect( log.mock.calls ).toEqual( [
				[ 'Running the "meta" task...' ],
				[ '  2 units in scope, 2 changed, 2 taken in this run.' ],
				[ '  Judging 2 units...' ],
				[ '  Fixing 1 units...' ]
			] );
		} );

		it( 'runs one task as two instances with their own files, state and findings', async () => {
			const results = await runTarget( baseOptions( createTarget( filesInstances() ) ) );

			expect( results.map( ( { task, title, summary } ) => [ task, title, summary!.units ] ) ).toEqual( [
				[ 'files', 'Task files', 2 ],
				[ 'files-b', 'Task files (files-b)', 1 ]
			] );

			const [ finding ] = await readOpen( 'files' );
			const [ instanceFinding ] = await readOpen( 'files-b' );

			expect( finding ).toMatchObject( { fingerprint: 'files|docs/b.md|R1|', task: 'files', unit: 'docs/b.md' } );
			expect( instanceFinding ).toMatchObject( { fingerprint: 'files-b|docs/b.md|R1|', task: 'files-b', unit: 'docs/b.md' } );
			expect( instanceFinding!.id ).not.toBe( finding!.id );
			expect( await readText( upath.join( checkout, '.ai-tasks/files-b/report.md' ) ) ).toContain( '# Task files (files-b)' );
		} );

		it( 'selects instances by their name', async () => {
			const results = await runTarget( { ...baseOptions( createTarget( filesInstances() ) ), taskIds: [ 'files-b' ] } );

			expect( results.map( result => result.task ) ).toEqual( [ 'files-b' ] );
		} );

		it( 'passes the options of the instance to the hooks', async () => {
			const judge = vi.fn( () => [] );
			const instance = createInstance( 'files', {
				task: createTask( 'files', { scope: undefined, judge } ),
				include: [ 'docs/a.md' ],
				options: { limit: 3 }
			} );

			await runTarget( baseOptions( createTarget( [ instance ] ) ) );

			expect( judge ).toHaveBeenCalledWith( expect.objectContaining( { options: { limit: 3 } } ) );
		} );

		it( 'runs a task requested explicitly, even when the target disables it', async () => {
			const results = await runTarget( { ...baseOptions( createTarget( [ [ 'meta', true ], [ 'plain', false ] ] ) ), taskIds: [ 'plain' ] } );

			expect( results.map( result => result.task ) ).toEqual( [ 'plain' ] );
		} );

		it( 'keeps fixed findings on the next local run', async () => {
			await runTarget( baseOptions( createTarget( [ [ 'meta', true ] ] ) ) );
			await runTarget( baseOptions( createTarget( [ [ 'meta', true ] ] ) ) );

			expect( ( await readOpen( 'meta' ) ).map( finding => Boolean( finding.fix ) ) ).toEqual( [ true ] );
		} );

		it( 'uses `HEAD` in the links of the report when HEAD is detached', async () => {
			git( checkout, 'checkout', '--quiet', '--detach' );
			workspace = await openWorkspace( { cwd: checkout, author } );

			await runTarget( baseOptions( createTarget( [ [ 'plain', true ] ] ) ) );

			expect( await readText( upath.join( checkout, '.ai-tasks/plain/report.md' ) ) ).toContain( '(https://github.com/owner/repo/blob/HEAD/docs/b.md)' );
		} );

		it( 'passes the messages of `log()` in the hooks to the logger, indented like the progress', async () => {
			await runTarget( baseOptions( createTarget( [ [ 'chatty', true ] ] ) ) );

			expect( log ).toHaveBeenCalledWith( '  Hello from the task.' );
		} );

		it( 'records a failing task and continues with the next one', async () => {
			const results = await runTarget( baseOptions( createTarget( [ [ 'broken', true ], [ 'plain', true ] ] ) ) );

			expect( results ).toEqual( [
				{ task: 'broken', title: 'Task broken', failure: 'Broken scope.', durationMs: expect.any( Number ) },
				expect.objectContaining( { task: 'plain' } )
			] );
			expect( log ).toHaveBeenCalledWith( '  The "broken" task failed: Broken scope.' );
			expect( log ).toHaveBeenCalledWith( 'Running the "plain" task...' );
		} );

		it( 'records a task that throws something other than an error as failed', async () => {
			const results = await runTarget( baseOptions( createTarget( [ [ 'throwing', true ] ] ) ) );

			expect( results ).toEqual( [
				{ task: 'throwing', title: 'Task throwing', failure: 'The token is missing.', durationMs: expect.any( Number ) }
			] );
		} );
	} );

	describe( 'published run', () => {
		let github: { [ K in keyof GitHubClient ]: Mock };

		beforeEach( () => {
			github = {
				findOpenPullRequest: vi.fn( async () => null ),
				createPullRequest: vi.fn( async ( { head }: { head: string } ) => ( { number: head.includes( 'meta' ) ? 1 : 2, html_url: `https://pr/${ head }` } ) ),
				updatePullRequest: vi.fn( async () => ( {} ) ),
				createComment: vi.fn( async () => ( {} ) )
			};
		} );

		const publish = ( tasksToRun: Array<[ string, boolean ] | TaskInstance> ) => runTarget( {
			...baseOptions( createTarget( tasksToRun ) ),
			github: github as unknown as GitHubClient,
			buildUrl: 'https://ci/1'
		} );

		// CI prepares a new checkout of the base branch for every run.
		const newCheckout = async () => {
			checkout = await createCheckout( remote );
			workspace = await openWorkspace( { cwd: checkout, author } );
		};

		const readRemote = ( branch: string, path: string ) => git( remote, 'show', `${ branch }:${ path }` );

		const expectBackOnTheBase = () => {
			expect( git( checkout, 'rev-parse', '--abbrev-ref', 'HEAD' ).trim() ).toBe( 'stable' );
			expect( git( checkout, 'status', '--porcelain' ).trim() ).toBe( '' );
		};

		it( 'pushes one report branch per instance, with the name of the instance in the title', async () => {
			const results = await publish( filesInstances() );

			expect( results.map( result => result.pullRequestUrl ) ).toEqual( [
				'https://pr/ai-tasks/files/x/stable',
				'https://pr/ai-tasks/files-b/x/stable'
			] );
			expect( JSON.parse( readRemote( 'ai-tasks/files-b/x/stable', '.ai-tasks/files-b/open.json' ) ) ).toHaveLength( 1 );
			expect( github.createPullRequest ).toHaveBeenCalledWith( expect.objectContaining( {
				head: 'ai-tasks/files-b/x/stable',
				title: 'Task files (files-b): x (stable)'
			} ) );
			expectBackOnTheBase();
		} );

		it( 'pushes one report branch per task, opens a pull request for each, and returns to the base branch', async () => {
			const results = await publish( [ [ 'meta', true ], [ 'plain', true ] ] );

			expect( results.map( result => result.pullRequestUrl ) ).toEqual( [
				'https://pr/ai-tasks/meta/x/stable',
				'https://pr/ai-tasks/plain/x/stable'
			] );

			// The fix and the state are committed together, once.
			expect( readRemote( 'ai-tasks/meta/x/stable', 'docs/b.md' ) ).toBe( 'GOOD\n' );
			expect( git( remote, 'log', '--format=%s|%an', 'stable..ai-tasks/meta/x/stable' ).trim() ).toBe( 'Task meta: 2 units judged.|Bot' );
			expect( readRemote( 'ai-tasks/plain/x/stable', 'docs/b.md' ) ).toBe( 'BAD\n' );
			expect( JSON.parse( readRemote( 'ai-tasks/plain/x/stable', '.ai-tasks/plain/open.json' ) ) ).toHaveLength( 1 );
			expect( () => readRemote( 'ai-tasks/plain/x/stable', '.ai-tasks/meta/open.json' ) ).toThrow();

			expect( github.findOpenPullRequest ).toHaveBeenCalledWith( { slug: 'owner/repo', head: 'ai-tasks/meta/x/stable' } );
			expect( github.createPullRequest ).toHaveBeenCalledWith( expect.objectContaining( {
				slug: 'owner/repo',
				head: 'ai-tasks/meta/x/stable',
				base: 'stable',
				title: 'Task meta: x (stable)',
				body: expect.stringContaining( '**0** open findings, **1** fixed in this pull request.' )
			} ) );

			expect( github.createPullRequest ).toHaveBeenCalledWith( expect.objectContaining( {
				head: 'ai-tasks/plain/x/stable',
				body: expect.stringContaining( '**1** open finding, **0** fixed in this pull request.' )
			} ) );
			expect( github.updatePullRequest ).not.toHaveBeenCalled();
			expect( github.createComment ).toHaveBeenCalledWith( {
				slug: 'owner/repo',
				number: 1,
				body: expect.stringContaining( '### [Run](https://ci/1) on 2026-09-29' )
			} );
			expect( results[ 0 ] ).toMatchObject( { title: 'Task meta', durationMs: expect.any( Number ) } );

			expect( log.mock.calls.slice( 0, 2 ) ).toEqual( [
				[ 'Running the "meta" task...' ],
				[ '  Starting the "ai-tasks/meta/x/stable" report branch at "stable".' ]
			] );
			expect( log ).toHaveBeenCalledWith( '  Opened the report pull request: https://pr/ai-tasks/meta/x/stable' );
			expect( log ).toHaveBeenCalledWith( '  Opened the report pull request: https://pr/ai-tasks/plain/x/stable' );
			expectBackOnTheBase();
			expect( await readText( upath.join( checkout, 'docs/b.md' ) ) ).toBe( 'BAD\n' );
		} );

		it( 'continues an open pull request, keeps its fixed findings and pushes nothing when nothing is new', async () => {
			await publish( [ [ 'meta', true ] ] );

			github.findOpenPullRequest.mockResolvedValue( { number: 1, html_url: 'https://pr/1' } );
			github.createPullRequest.mockClear();
			github.updatePullRequest.mockClear();
			github.createComment.mockClear();
			log.mockClear();

			await newCheckout();

			const results = await publish( [ [ 'meta', true ] ] );

			expect( results ).toEqual( [ expect.objectContaining( { task: 'meta' } ) ] );
			expect( results[ 0 ]!.pullRequestUrl ).toBe( 'https://pr/1' );
			expect( github.createPullRequest ).not.toHaveBeenCalled();
			expect( github.updatePullRequest ).not.toHaveBeenCalled();
			expect( github.createComment ).not.toHaveBeenCalled();
			expect( log ).toHaveBeenCalledWith( '  Continuing the open report pull request: https://pr/1' );
			expect( log ).toHaveBeenLastCalledWith( '  Nothing new. Nothing was pushed.' );
			expectBackOnTheBase();

			// A change on the base branch is merged in and judged.
			await pushFiles( seed, { 'docs/c.md': 'Also BAD\n' } );
			await newCheckout();

			const next = await publish( [ [ 'meta', true ] ] );
			const open = JSON.parse( readRemote( 'ai-tasks/meta/x/stable', '.ai-tasks/meta/open.json' ) ) as Array<Finding>;

			expect( next[ 0 ]!.pullRequestUrl ).toBe( 'https://pr/1' );
			expect( github.createPullRequest ).not.toHaveBeenCalled();
			expect( github.updatePullRequest ).toHaveBeenCalledOnce();
			expect( open.map( finding => [ finding.unit, Boolean( finding.fix ) ] ) ).toEqual( [ [ 'docs/b.md', true ], [ 'docs/c.md', true ] ] );
			expect( git( remote, 'log', '--format=%s', 'ai-tasks/meta/x/stable' ) ).toContain( 'Merge stable into ai-tasks/meta/x/stable.' );
			expectBackOnTheBase();
		} );

		it( 'prunes the fixed findings when a new report branch starts after a merge', async () => {
			await publish( [ [ 'meta', true ] ] );

			// The report pull request was merged.
			git( seed, 'fetch', '--quiet', 'origin' );
			git( seed, 'merge', '--quiet', '--no-edit', 'origin/ai-tasks/meta/x/stable' );
			git( seed, 'push', '--quiet', 'origin', 'HEAD:stable' );
			await newCheckout();

			const results = await publish( [ [ 'meta', true ] ] );

			expect( results[ 0 ]!.summary ).toMatchObject( { judged: 0, open: 0 } );
			expect( JSON.parse( readRemote( 'ai-tasks/meta/x/stable', '.ai-tasks/meta/open.json' ) ) ).toEqual( [] );
			expect( github.createPullRequest ).toHaveBeenCalledTimes( 2 );
		} );

		it( 'records a merge conflict as a failure of the task, returns to the base branch and continues with the next task', async () => {
			await publish( [ [ 'meta', true ], [ 'plain', true ] ] );
			await pushFiles( seed, { '.ai-tasks/meta/open.json': 'conflict\n' } );
			await newCheckout();

			github.findOpenPullRequest.mockImplementation( async ( { head }: { head: string } ) => ( { number: 1, html_url: `https://pr/${ head }` } ) );

			const results = await publish( [ [ 'meta', true ], [ 'plain', true ] ] );

			expect( results[ 0 ] ).toEqual( {
				task: 'meta',
				title: 'Task meta',
				failure: expect.stringContaining( 'Merging "stable" into "ai-tasks/meta/x/stable" failed.' ),
				durationMs: expect.any( Number )
			} );
			expect( results[ 1 ] ).toMatchObject( { task: 'plain', summary: { alreadyOpen: 0 } } );
			expectBackOnTheBase();
		} );

		it( 'does not touch the pull request and returns to the base branch when the task fails before pushing', async () => {
			const results = await publish( [ [ 'broken', true ] ] );

			expect( results ).toEqual( [ {
				task: 'broken',
				title: 'Task broken',
				failure: 'Broken scope.',
				durationMs: expect.any( Number )
			} ] );
			expect( github.createPullRequest ).not.toHaveBeenCalled();
			expect( github.updatePullRequest ).not.toHaveBeenCalled();
			expectBackOnTheBase();
		} );

		it.each( [ 'commit', 'push' ] as const )(
			'keeps the completed summary and continues with the next task when %s fails', async method => {
				vi.spyOn( workspace, method ).mockRejectedValueOnce( new Error( 'Git unavailable.' ) );

				const results = await publish( [ [ 'meta', true ], [ 'plain', true ] ] );

				expect( results[ 0 ] ).toMatchObject( {
					failure: 'Git unavailable.', summary: { judged: 2, fixed: 1 }
				} );
				expect( results[ 1 ] ).toMatchObject( { task: 'plain', summary: { judged: 2 } } );
				expect( github.createPullRequest ).toHaveBeenCalledOnce();
				expectBackOnTheBase();
			}
		);

		it( 'keeps the completed summary and both errors when publishing and cleanup fail', async () => {
			const returnToBase = workspace.returnToBase;

			vi.spyOn( workspace, 'push' ).mockRejectedValueOnce( new Error( 'Push failed.' ) );
			vi.spyOn( workspace, 'returnToBase' ).mockImplementationOnce( async () => {
				await returnToBase();

				throw new Error( 'Cleanup failed.' );
			} );

			const results = await publish( [ [ 'meta', true ] ] );

			expect( results[ 0 ] ).toMatchObject( {
				summary: { judged: 2, fixed: 1 },
				failure: 'Push failed.\nReturning to the base branch failed: Cleanup failed.'
			} );
			expect( github.createPullRequest ).not.toHaveBeenCalled();
			expectBackOnTheBase();
		} );

		it( 'keeps the completed summary and pull request URL when only cleanup fails', async () => {
			vi.spyOn( workspace, 'returnToBase' ).mockRejectedValueOnce( new Error( 'Cleanup failed.' ) );

			const results = await publish( [ [ 'meta', true ] ] );

			expect( results[ 0 ] ).toMatchObject( {
				summary: { judged: 2, fixed: 1 },
				pullRequestUrl: 'https://pr/ai-tasks/meta/x/stable',
				failure: 'Returning to the base branch failed: Cleanup failed.'
			} );
		} );

		it( 'records a failure to open the pull request after the push', async () => {
			github.createPullRequest.mockRejectedValue( new Error( 'Forbidden.' ) );

			const results = await publish( [ [ 'meta', true ] ] );

			expect( results[ 0 ] ).toMatchObject( { task: 'meta', failure: 'Forbidden.', summary: { judged: 2 } } );
			expect( readRemote( 'ai-tasks/meta/x/stable', 'docs/b.md' ) ).toBe( 'GOOD\n' );
			expect( github.createComment ).not.toHaveBeenCalled();
			expectBackOnTheBase();
		} );

		it( 'returns to the base branch after checkout switches branches and then fails', async () => {
			const checkout = workspace.checkoutReportBranch;
			vi.spyOn( workspace, 'checkoutReportBranch' ).mockImplementationOnce( async options => {
				await checkout( options );

				throw new Error( 'Checkout interrupted.' );
			} );

			const results = await publish( [ [ 'meta', true ], [ 'plain', true ] ] );

			expect( results[ 0 ] ).toMatchObject( { failure: 'Checkout interrupted.' } );
			expect( results[ 1 ] ).toMatchObject( { task: 'plain', summary: { judged: 2 } } );
			expectBackOnTheBase();
		} );

		it.each( [ 'updatePullRequest', 'createComment' ] as const )(
			'keeps the completed summary and continues with the next task when %s fails', async method => {
				github.findOpenPullRequest.mockResolvedValue( { number: 7, html_url: 'https://pr/7' } );
				github[ method ].mockRejectedValueOnce( new Error( 'API unavailable.' ) );

				const results = await publish( [ [ 'meta', true ], [ 'plain', true ] ] );

				expect( results[ 0 ] ).toMatchObject( {
					failure: 'API unavailable.', summary: { judged: 2 }, pullRequestUrl: 'https://pr/7'
				} );
				expect( results[ 1 ] ).toMatchObject( { task: 'plain', summary: { judged: 2 } } );
				expectBackOnTheBase();
			}
		);
	} );
} );
