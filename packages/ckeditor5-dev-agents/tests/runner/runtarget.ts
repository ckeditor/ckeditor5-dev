/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-disable @stylistic/max-len */

import { afterEach, beforeEach, describe, it, expect, vi, type Mock } from 'vitest';
import upath from 'upath';
import { getReportBranch, getReportBranchPart, runTarget, type RunTargetOptions } from '../../src/runner/runtarget.js';
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

	it( 'adds the part of the stack from the second part on', () => {
		expect( getReportBranch( 'meta', { name: 'cs' }, 'stable', 1 ) ).toBe( 'ai-tasks/meta/cs/stable' );
		expect( getReportBranch( 'meta', { name: 'cs' }, 'release/v1', 12 ) ).toBe( 'ai-tasks/meta/cs/release/v1--12' );
	} );
} );

describe( 'getReportBranchPart()', () => {
	it.each( [
		[ 'ai-tasks/meta/cs/stable', 1 ],
		[ 'ai-tasks/meta/cs/stable--2', 2 ],
		[ 'ai-tasks/meta/cs/stable--10', 10 ],
		[ 'ai-tasks/meta/cs/stable--0', null ],
		[ 'ai-tasks/meta/cs/stable--02', null ],
		[ 'ai-tasks/meta/cs/stable--x', null ],
		[ 'ai-tasks/meta/cs/stable-2', null ],
		[ 'ai-tasks/meta/cs/stable/next', null ],
		[ 'ai-tasks/other/cs/stable', null ]
	] )( 'reads "%s" as part %s', ( branch, part ) => {
		expect( getReportBranchPart( 'ai-tasks/meta/cs/stable', branch ) ).toBe( part );
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
				listOpenPullRequests: vi.fn( async () => [] ),
				wasMerged: vi.fn( async () => true ),
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

			expect( github.listOpenPullRequests ).toHaveBeenCalledWith( { slug: 'owner/repo', filter: expect.any( Function ) } );
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

		// The open report pull requests, from the given heads with the given bases.
		const openPullRequests = ( ...pulls: Array<[ number, string, string ]> ) => {
			github.listOpenPullRequests.mockImplementation( async ( { filter }: { filter: ( head: string ) => boolean } ) => {
				return pulls.filter( ( [ , head ] ) => filter( head ) ).map( ( [ number, head, base ] ) => ( { number, html_url: `https://pr/${ number }`, head, base } ) );
			} );
		};

		it( 'stacks a new pull request on the open one, keeps its fixed findings and pushes nothing when nothing is new', async () => {
			await publish( [ [ 'meta', true ] ] );

			openPullRequests( [ 1, 'ai-tasks/meta/x/stable', 'stable' ], [ 9, 'ai-tasks/other/x/stable', 'stable' ], [ 8, 'ai-tasks/meta/x/stable-fix', 'stable' ] );
			github.createPullRequest.mockClear();
			github.createComment.mockClear();
			log.mockClear();

			await newCheckout();

			const results = await publish( [ [ 'meta', true ] ] );

			expect( results ).toEqual( [ expect.objectContaining( { task: 'meta' } ) ] );
			expect( results[ 0 ]!.pullRequestUrl ).toBeUndefined();
			expect( github.createPullRequest ).not.toHaveBeenCalled();
			expect( github.updatePullRequest ).not.toHaveBeenCalled();
			expect( github.createComment ).not.toHaveBeenCalled();
			expect( log ).toHaveBeenCalledWith( '  Stacking the "ai-tasks/meta/x/stable--2" report branch on the open report pull request: https://pr/1' );
			expect( log ).toHaveBeenLastCalledWith( '  Nothing new. Nothing was pushed.' );
			expect( () => git( remote, 'rev-parse', '--verify', 'ai-tasks/meta/x/stable--2' ) ).toThrow();
			expectBackOnTheBase();

			// A change on the base branch is merged into the open branch, and the new run opens a pull request on top of it.
			await pushFiles( seed, { 'docs/c.md': 'Also BAD\n' } );
			await newCheckout();

			const next = await publish( [ [ 'meta', true ] ] );
			const open = JSON.parse( readRemote( 'ai-tasks/meta/x/stable--2', '.ai-tasks/meta/open.json' ) ) as Array<Finding>;

			expect( next[ 0 ]!.pullRequestUrl ).toBe( 'https://pr/ai-tasks/meta/x/stable--2' );
			expect( github.createPullRequest ).toHaveBeenCalledExactlyOnceWith( expect.objectContaining( {
				head: 'ai-tasks/meta/x/stable--2',
				base: 'ai-tasks/meta/x/stable',
				title: 'Task meta: x (stable), part 2',
				body: expect.stringContaining( 'It is stacked on #1, so it shows only the changes of this run.' )
			} ) );
			expect( open.map( finding => [ finding.unit, Boolean( finding.fix ) ] ) ).toEqual( [ [ 'docs/b.md', true ], [ 'docs/c.md', true ] ] );
			expect( git( remote, 'log', '-1', '--format=%s', 'ai-tasks/meta/x/stable' ).trim() ).toBe( 'Merge stable into ai-tasks/meta/x/stable.' );
			expect( git( remote, 'diff', '--name-only', 'ai-tasks/meta/x/stable', 'ai-tasks/meta/x/stable--2' ).trim().split( '\n' ) )
				.toEqual( [ '.ai-tasks/meta/baseline.json', '.ai-tasks/meta/open.json', '.ai-tasks/meta/report.md', 'docs/c.md' ] );
			expectBackOnTheBase();
		} );

		it( 'adds the state of a run without new findings or fixes to the top of the stack, without a new pull request', async () => {
			await publish( [ [ 'meta', true ] ] );

			openPullRequests( [ 1, 'ai-tasks/meta/x/stable', 'stable' ] );
			github.createPullRequest.mockClear();
			github.createComment.mockClear();

			// The new guide is fine: it is judged, so the baseline changes, but nothing is found.
			await pushFiles( seed, { 'docs/c.md': 'Fine.\n' } );
			await newCheckout();

			const results = await publish( [ [ 'meta', true ] ] );

			expect( results[ 0 ] ).toMatchObject( { pullRequestUrl: 'https://pr/1', summary: { judged: 1, newFindings: 0, fixed: 0 } } );
			expect( github.createPullRequest ).not.toHaveBeenCalled();
			expect( github.createComment ).toHaveBeenCalledExactlyOnceWith( expect.objectContaining( { number: 1 } ) );
			expect( log ).toHaveBeenCalledWith( '  Nothing new to review. Added the state to the open report pull request: https://pr/1' );
			expect( Object.keys( JSON.parse( readRemote( 'ai-tasks/meta/x/stable', '.ai-tasks/meta/baseline.json' ) ) ) ).toContain( 'docs/c.md' );
			expect( () => git( remote, 'rev-parse', '--verify', 'ai-tasks/meta/x/stable--2' ) ).toThrow();
			expectBackOnTheBase();
		} );

		it( 'merges the state of a part into the next one when both changed it, for example after a rejection below', async () => {
			const first = 'ai-tasks/meta/x/stable';
			const second = 'ai-tasks/meta/x/stable--2';

			await publish( [ [ 'meta', true ] ] );
			openPullRequests( [ 1, first, 'stable' ] );
			await pushFiles( seed, { 'docs/c.md': 'Also BAD\n' } );
			await newCheckout();
			await publish( [ [ 'meta', true ] ] );

			// A human rejects the finding of `docs/b.md` in the first part: its fix is reverted, and it leaves the state.
			git( seed, 'fetch', '--quiet', 'origin' );
			git( seed, 'checkout', '--quiet', '-B', first, `origin/${ first }` );

			const open = JSON.parse( git( seed, 'show', 'HEAD:.ai-tasks/meta/open.json' ) ) as Array<Finding>;
			const baseline = JSON.parse( git( seed, 'show', 'HEAD:.ai-tasks/meta/baseline.json' ) ) as Record<string, string>;

			delete baseline[ 'docs/b.md' ];
			await pushFiles( seed, {
				'docs/b.md': 'BAD\n',
				'.ai-tasks/meta/open.json': JSON.stringify( open.filter( finding => finding.unit !== 'docs/b.md' ), null, '\t' ) + '\n',
				'.ai-tasks/meta/baseline.json': JSON.stringify( baseline, null, '\t' ) + '\n',
				'.ai-tasks/meta/report.md': 'The report after the rejection.\n'
			}, first );
			git( seed, 'checkout', '--quiet', 'stable' );

			openPullRequests( [ 1, first, 'stable' ], [ 2, second, first ] );
			await pushFiles( seed, { 'docs/d.md': 'BAD too\n' } );
			await newCheckout();

			const results = await publish( [ [ 'meta', true ] ] );
			const secondOpen = JSON.parse( readRemote( second, '.ai-tasks/meta/open.json' ) ) as Array<Finding>;
			const secondReport = readRemote( second, '.ai-tasks/meta/report.md' );

			expect( results[ 0 ]!.failure ).toBeUndefined();
			expect( git( remote, 'log', '-1', '--format=%s', second ).trim() ).toBe( `Merge ${ first } into ${ second }.` );
			expect( secondOpen.map( finding => finding.unit ) ).toEqual( [ 'docs/c.md' ] );
			expect( Object.keys( JSON.parse( readRemote( second, '.ai-tasks/meta/baseline.json' ) ) ) ).not.toContain( 'docs/b.md' );
			expect( secondReport ).not.toContain( '<<<<<<<' );
			expect( secondReport ).toContain( 'docs/c.md' );
			expect( github.createPullRequest ).toHaveBeenLastCalledWith( expect.objectContaining( { head: 'ai-tasks/meta/x/stable--3', base: second } ) );
			expectBackOnTheBase();
		} );

		it( 'bases a stacked pull request on the one below it again when that one was merged', async () => {
			await publish( [ [ 'meta', true ] ] );

			// Part 1 was merged. Part 2 is still open.
			git( remote, 'branch', 'ai-tasks/meta/x/stable--2', 'ai-tasks/meta/x/stable' );
			openPullRequests( [ 5, 'ai-tasks/meta/x/stable--2', 'ai-tasks/meta/x/stable' ] );
			await pushFiles( seed, { 'docs/c.md': 'Also BAD\n' } );
			await newCheckout();

			await publish( [ [ 'meta', true ] ] );

			expect( github.wasMerged ).toHaveBeenCalledExactlyOnceWith( { slug: 'owner/repo', head: 'ai-tasks/meta/x/stable' } );
			expect( github.updatePullRequest ).toHaveBeenCalledExactlyOnceWith( { slug: 'owner/repo', number: 5, base: 'stable' } );
			expect( log ).toHaveBeenCalledWith( '  Changed the base of https://pr/5 from "ai-tasks/meta/x/stable" to "stable".' );
			expect( github.createPullRequest ).toHaveBeenLastCalledWith( expect.objectContaining( {
				head: 'ai-tasks/meta/x/stable--3',
				base: 'ai-tasks/meta/x/stable--2',
				title: 'Task meta: x (stable), part 3'
			} ) );
		} );

		it( 'fails the task, and changes nothing, when a part is based on a part closed without merging', async () => {
			github.wasMerged.mockResolvedValue( false );
			openPullRequests( [ 5, 'ai-tasks/meta/x/stable--2', 'ai-tasks/meta/x/stable' ] );

			const results = await publish( [ [ 'meta', true ] ] );

			expect( results[ 0 ]!.failure ).toBe(
				'The report pull request https://pr/5 is based on "ai-tasks/meta/x/stable", whose pull request was closed without merging. ' +
				'Merging https://pr/5 would land its changes too. Close https://pr/5 as well, or change its base by hand.'
			);
			expect( github.updatePullRequest ).not.toHaveBeenCalled();
			expect( github.createPullRequest ).not.toHaveBeenCalled();
			expectBackOnTheBase();
		} );

		it( 'tells Slack about a new report pull request', async () => {
			const fetchMock = vi.fn( async () => new Response( 'ok' ) );

			vi.stubGlobal( 'fetch', fetchMock );

			const results = await runTarget( {
				...baseOptions( createTarget( [ [ 'meta', true ] ] ) ),
				github: github as unknown as GitHubClient,
				slackWebhookUrl: 'https://hooks.slack/x'
			} );

			const [ url, init ] = fetchMock.mock.calls[ 0 ] as unknown as [ string, RequestInit ];

			expect( url ).toBe( 'https://hooks.slack/x' );
			expect( JSON.parse( init.body as string ) ).toEqual( {
				text: '*Task meta* (x, `stable`) opened <https://pr/ai-tasks/meta/x/stable|#1>: 1 new finding, 1 fixed, 0 open.'
			} );
			expect( results[ 0 ]!.summary!.problems ).toEqual( [] );
		} );

		it( 'does not tell Slack about a report pull request without new findings or fixes', async () => {
			const fetchMock = vi.fn( async () => new Response( 'ok' ) );

			vi.stubGlobal( 'fetch', fetchMock );
			await pushFiles( seed, { 'docs/b.md': 'Fine.\n' } );
			await newCheckout();

			await runTarget( {
				...baseOptions( createTarget( [ [ 'meta', true ] ] ) ),
				github: github as unknown as GitHubClient,
				slackWebhookUrl: 'https://hooks.slack/x'
			} );

			expect( github.createPullRequest ).toHaveBeenCalledOnce();
			expect( fetchMock ).not.toHaveBeenCalled();
		} );

		it( 'reports a failed Slack notification as a problem, not as a failure', async () => {
			vi.stubGlobal( 'fetch', vi.fn( async () => new Response( 'invalid_token', { status: 403 } ) ) );

			const results = await runTarget( {
				...baseOptions( createTarget( [ [ 'meta', true ] ] ) ),
				github: github as unknown as GitHubClient,
				slackWebhookUrl: 'https://hooks.slack/x'
			} );

			expect( results[ 0 ]!.failure ).toBeUndefined();
			expect( results[ 0 ]!.summary!.problems ).toEqual( [
				{ message: 'Notifying Slack failed: The Slack webhook responded with status 403: invalid_token' }
			] );
			expect( log ).toHaveBeenCalledWith( '  Notifying Slack failed: The Slack webhook responded with status 403: invalid_token' );
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

			openPullRequests( [ 1, 'ai-tasks/meta/x/stable', 'stable' ], [ 2, 'ai-tasks/plain/x/stable', 'stable' ] );

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

		it( 'keeps the completed summary and continues with the next task when createComment fails', async () => {
			github.createComment.mockRejectedValueOnce( new Error( 'API unavailable.' ) );

			const results = await publish( [ [ 'meta', true ], [ 'plain', true ] ] );

			expect( results[ 0 ] ).toMatchObject( {
				failure: 'API unavailable.', summary: { judged: 2 }, pullRequestUrl: 'https://pr/ai-tasks/meta/x/stable'
			} );
			expect( results[ 1 ] ).toMatchObject( { task: 'plain', summary: { judged: 2 } } );
			expectBackOnTheBase();
		} );

		it( 'records a failure to read or fix the stack as a failure of the task, before anything runs', async () => {
			openPullRequests( [ 5, 'ai-tasks/meta/x/stable--2', 'gone' ] );
			github.updatePullRequest.mockRejectedValueOnce( new Error( 'API unavailable.' ) );

			const results = await publish( [ [ 'meta', true ], [ 'plain', true ] ] );

			expect( results[ 0 ] ).toEqual( { task: 'meta', title: 'Task meta', failure: 'API unavailable.', durationMs: expect.any( Number ) } );
			expect( results[ 1 ] ).toMatchObject( { task: 'plain', summary: { judged: 2 } } );
			expectBackOnTheBase();
		} );
	} );
} );
