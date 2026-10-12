/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-disable @stylistic/max-len */

import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { realpathSync } from 'node:fs';
import upath from 'upath';
import { runTask, type RunTaskOptions } from '../../src/runner/runtask.js';
import * as changeTracking from '../../src/runner/changetracker.js';
import { createAgent } from '../../src/agent/createagent.js';
import { hash } from '../../src/utils/text.js';
import { readJson, readText, removeTempDirectories, writeFiles } from '../_utils/files.js';
import { createRepository, git, isolateGit } from '../_utils/git.js';
import type { Finding, FindingInput, FixInput, InstanceTask, Task, TaskUnit } from '../../src/types.js';

vi.mock( '../../src/agent/createagent.js' );

type Payload = { content: string };

const TODAY = '2026-09-29';

function createTask( overrides: Partial<Task<unknown, TaskUnit, Payload>> = {} ): Task<unknown, TaskUnit, Payload> {
	return {
		id: 't',
		title: 'Task',
		ruleIds: [ 'R1', 'R2' ],
		include: [ 'docs/*.md' ],
		async scope( { repo } ) {
			return ( await repo.list( [ 'docs/*.md' ] ) ).map( path => ( { key: path, path } ) );
		},
		async contentHash( { repo, hash: hashText, unit } ) {
			return hashText( await repo.read( unit.path! ) );
		},
		async payload( { repo, unit } ) {
			return { content: await repo.read( unit.path! ) };
		},
		judge( { payload } ) {
			const findings: Array<FindingInput> = [];

			if ( payload.content.includes( 'BAD' ) ) {
				findings.push( { ruleId: 'R1', detail: 'Bad.' } );
			}

			if ( payload.content.includes( 'UGLY' ) ) {
				findings.push( { ruleId: 'R2', detail: 'Ugly.' } );
			}

			return findings;
		},
		...overrides
	};
}

// A task that fixes `BAD` by replacing it with `GOOD`.
function createFixingTask( overrides: Partial<Task<unknown, TaskUnit, Payload>> = {} ): Task<unknown, TaskUnit, Payload> {
	return createTask( {
		writes: [ 'docs/**' ],
		async fix( { repo, unit } ) {
			await repo.write( unit.path!, ( await repo.read( unit.path! ) ).replace( 'BAD', 'GOOD' ) );
		},
		...overrides
	} );
}

describe( 'runTask()', () => {
	let root: string;
	let statePath: string;

	beforeEach( async () => {
		await isolateGit();

		root = await createRepository( {
			'docs/a.md': 'Fine.\n',
			'docs/b.md': 'This is BAD.\n',
			'docs/c.md': 'Fine too.\n',
			'other.txt': 'Other.\n'
		} );
		statePath = upath.join( root, '.ai-tasks', 't' );

		vi.mocked( createAgent ).mockImplementation( ( { usage } ) => ( {
			async run<TOutput>() {
				const output: unknown = { findings: [] };

				usage.cost += 0.5;
				usage.tokens += 100;

				return { output: output as TOutput, text: '' };
			}
		} ) );
	} );

	afterEach( removeTempDirectories );

	// The overrides of the target that an instance applies to the task, and the options of the run.
	type RunOverrides = Partial<Pick<InstanceTask, 'include' | 'exclude' | 'maxUnits' | 'options'>> &
		Partial<Pick<RunTaskOptions, 'root' | 'pruneFixed' | 'log'>>;

	const runSaved = ( task: Task, { include = [], exclude = [], maxUnits = 100, options = { option: true }, ...overrides }: RunOverrides = {} ) => {
		return runTask( {
			instance: { task: { ...task, include, exclude, maxUnits, options }, directory: '/tasks/t', enabled: true },
			target: { name: 'x', slug: 'owner/repo', root: '.', tasks: new Map() },
			branch: 'stable',
			root,
			today: TODAY,
			pruneFixed: false,
			log: () => {},
			...overrides
		} );
	};

	const run = async ( task: Task, overrides: RunOverrides = {} ) => ( await runSaved( task, overrides ) ).summary;

	const readOpen = () => readJson<Array<Finding>>( upath.join( statePath, 'open.json' ) );
	const readBaseline = () => readJson<Record<string, string>>( upath.join( statePath, 'baseline.json' ) );
	const fileHash = ( content: string ) => hash( content );

	describe( 'judging', () => {
		it( 'judges every unit on the first run and writes the state', async () => {
			const log = vi.fn();
			const { summary, files } = await runSaved( createTask(), { log } );

			expect( summary ).toEqual( {
				task: 't',
				title: 'Task',
				units: 3,
				changed: 3,
				judged: 3,
				deferred: 0,
				newFindings: 1,
				alreadyOpen: 0,
				rejected: 0,
				fixed: 0,
				discarded: 0,
				changedFiles: 0,
				open: 1,
				errors: 0,
				problems: [],
				cost: 0,
				tokens: 0
			} );

			expect( await readBaseline() ).toEqual( {
				'docs/a.md': fileHash( 'Fine.\n' ),
				'docs/b.md': fileHash( 'This is BAD.\n' ),
				'docs/c.md': fileHash( 'Fine too.\n' )
			} );
			expect( await readOpen() ).toEqual( [ {
				fingerprint: 't|docs/b.md|R1|',
				id: hash( 't|docs/b.md|R1|' ),
				task: 't',
				unit: 'docs/b.md',
				ruleId: 'R1',
				discriminator: '',
				detail: 'Bad.',
				fragment: fileHash( 'This is BAD.\n' ),
				path: 'docs/b.md',
				reportedAt: TODAY
			} ] );
			expect( await readText( upath.join( statePath, 'report.md' ) ) ).toContain( '# Task' );
			expect( files ).toEqual( [] );
			// A task without `writes` fixes nothing, so there is no fixing stage.
			expect( log.mock.calls ).toEqual( [
				[ '3 units in scope, 3 changed, 3 taken in this run.' ],
				[ 'Judging 3 units...' ]
			] );
		} );

		it( 'makes every file matching `include` and not `exclude` a unit, when the task has no `scope()`', async () => {
			const withoutScope = createTask( { scope: undefined } );
			const contentHash = vi.fn( withoutScope.contentHash );
			const summary = await run( { ...withoutScope, contentHash }, { include: [ 'docs/*.md', 'other.txt' ], exclude: [ 'docs/c.md' ] } );

			expect( summary.units ).toBe( 3 );
			expect( contentHash.mock.calls.map( ( [ { unit } ] ) => unit ) ).toEqual( [
				{ key: 'docs/a.md', path: 'docs/a.md' },
				{ key: 'docs/b.md', path: 'docs/b.md' },
				{ key: 'other.txt', path: 'other.txt' }
			] );
		} );

		it( 'judges nothing when an instance overrides `include` with an empty array', async () => {
			expect( ( await run( createTask( { scope: undefined } ) ) ).units ).toBe( 0 );
		} );

		it( 'passes `include` and `exclude` to `scope()`', async () => {
			const scope = vi.fn( () => [] );

			await run( createTask( { scope } ), { include: [ 'docs/**' ], exclude: [ 'docs/c.md' ] } );

			expect( scope ).toHaveBeenCalledWith( expect.objectContaining( { include: [ 'docs/**' ], exclude: [ 'docs/c.md' ] } ) );
		} );

		it( 'passes the messages of `log()` in the hooks to the logger', async () => {
			const log = vi.fn();

			await run( createTask( {
				scope: ( { log: taskLog } ) => {
					taskLog( 'From the task.' );

					return [];
				}
			} ), { log } );

			// Nothing to judge: no judging stage.
			expect( log.mock.calls ).toEqual( [ [ 'From the task.' ], [ '0 units in scope, 0 changed, 0 taken in this run.' ] ] );
		} );

		it( 'ignores the messages of `log()` in the hooks without a logger', async () => {
			const summary = await run( createTask( {
				scope: ( { log } ) => {
					log( 'Nobody listens.' );

					return [];
				}
			} ) );

			expect( summary.units ).toBe( 0 );
		} );

		it( 'reports the warnings of the agents once, after the warnings of the state', async () => {
			await writeFiles( statePath, { 'decisions/broken.yml': 'broken' } );

			vi.mocked( createAgent ).mockImplementation( ( { warn } ) => {
				warn( 'A skill could not be loaded: missing description.' );

				return { run: async () => ( { output: undefined as never, text: '' } ) };
			} );

			const summary = await run( createTask() );

			expect( summary.problems ).toEqual( [
				{ message: expect.stringContaining( 'decisions/broken.yml' ) },
				{ message: 'A skill could not be loaded: missing description.' }
			] );
		} );

		it( 'skips unchanged units and still saves the state once', async () => {
			await run( createTask() );

			const judge = vi.fn( () => [] );
			const { summary, files } = await runSaved( createTask( { judge } ) );

			expect( summary ).toMatchObject( { units: 3, changed: 0, judged: 0, deferred: 0, open: 1 } );
			expect( judge ).not.toHaveBeenCalled();
			expect( files ).toEqual( [] );
		} );

		it( 'takes at most `maxUnits` changed units, in the order of their keys, and leaves the rest for the next runs', async () => {
			const judged: Array<string> = [];
			const log = vi.fn();
			const task = createTask( {
				judge( input ) {
					judged.push( input.unit.key );

					return createTask().judge( input );
				}
			} );

			const first = await run( task, { maxUnits: 2, log } );

			expect( first ).toMatchObject( { units: 3, changed: 3, judged: 2, deferred: 1 } );
			expect( judged ).toEqual( [ 'docs/a.md', 'docs/b.md' ] );
			expect( Object.keys( await readBaseline() ) ).toEqual( [ 'docs/a.md', 'docs/b.md' ] );
			expect( log ).toHaveBeenCalledWith( '3 units in scope, 3 changed, 2 taken in this run (1 left for the next runs).' );
			expect( log ).toHaveBeenCalledWith( 'Judging 2 units...' );

			// The next run continues with the units that are still changed.
			const second = await run( task, { maxUnits: 2 } );

			expect( second ).toMatchObject( { changed: 1, judged: 1, deferred: 0 } );
			expect( judged ).toEqual( [ 'docs/a.md', 'docs/b.md', 'docs/c.md' ] );
		} );

		it( 'returns the report data after saving the state', async () => {
			const { summary, open } = await runSaved( createTask() );

			expect( summary.judged ).toBe( 3 );
			expect( Object.keys( await readBaseline() ) ).toHaveLength( 3 );
			expect( open ).toEqual( await readOpen() );
		} );

		it( 'drops units that left the scope from the baseline but keeps their open findings', async () => {
			const gone: Finding = {
				fingerprint: 't|docs/gone.md|R1|', id: 'gone01', task: 't', unit: 'docs/gone.md', ruleId: 'R1', discriminator: '', detail: 'x', fragment: 'f'
			};

			await writeFiles( statePath, {
				'baseline.json': JSON.stringify( { 'docs/gone.md': 'f' } ),
				'open.json': JSON.stringify( [ gone ] )
			} );

			await run( createTask() );

			expect( await readBaseline() ).not.toHaveProperty( 'docs/gone.md' );
			expect( ( await readOpen() ).map( finding => finding.unit ) ).toEqual( [ 'docs/b.md', 'docs/gone.md' ] );
		} );

		it( 'does not report a finding that is already open', async () => {
			await run( createTask() );
			await writeFiles( statePath, { 'baseline.json': '{}' } );

			const summary = await run( createTask() );

			expect( summary ).toMatchObject( { newFindings: 0, alreadyOpen: 1, open: 1 } );
		} );

		it( 'does not report a finding rejected by a decision that still holds', async () => {
			await writeFiles( statePath, {
				'decisions/b.yml': `unit: docs/b.md\nrule: R1\nfragment: ${ fileHash( 'This is BAD.\n' ) }\nreason: It is fine.\n`
			} );

			const summary = await run( createTask() );

			expect( summary ).toMatchObject( { newFindings: 0, rejected: 1, open: 0 } );
			expect( await readOpen() ).toEqual( [] );
		} );

		it( 'reports a finding again when its decision expired, and passes the decisions to the judge', async () => {
			await writeFiles( statePath, {
				'decisions/1.yml': 'unit: docs/b.md\nrule: R1\nfragment: old\nfinding: It was bad.\nreason: It was fine.\n',
				'decisions/2.yml': `unit: docs/b.md\nrule: R2\nfragment: ${ fileHash( 'This is BAD.\n' ) }\nreason: Current.\n`,
				'decisions/broken.yml': 'nope'
			} );

			const judge = vi.fn( createTask().judge );
			const summary = await run( createTask( { judge } ) );
			const [ finding ] = await readOpen();

			expect( summary.problems ).toEqual( [ { message: expect.stringContaining( 'decisions/broken.yml' ) } ] );
			expect( finding!.previousDecision ).toEqual( { file: '1.yml', fragment: 'old', finding: 'It was bad.', reason: 'It was fine.' } );

			const priorDecisions = judge.mock.calls.find( ( [ input ] ) => input.unit.key === 'docs/b.md' )![ 0 ].priorDecisions;

			expect( priorDecisions ).toEqual( [
				{ unit: 'docs/b.md', rule: 'R1', discriminator: '', fragment: 'old', finding: 'It was bad.', reason: 'It was fine.', expired: true },
				{ unit: 'docs/b.md', rule: 'R2', discriminator: '', fragment: fileHash( 'This is BAD.\n' ), finding: '', reason: 'Current.', expired: false }
			] );
			expect( judge.mock.calls.find( ( [ input ] ) => input.unit.key === 'docs/a.md' )![ 0 ].priorDecisions ).toEqual( [] );
		} );

		it( 'reports a finding returned twice in one result once', async () => {
			const summary = await run( createTask( {
				judge: ( { unit } ) => unit.key === 'docs/b.md' ? [ { ruleId: 'R1', detail: 'One.' }, { ruleId: 'R1', detail: 'Two.' } ] : []
			} ) );

			expect( summary.newFindings ).toBe( 1 );
			expect( ( await readOpen() ).map( finding => finding.detail ) ).toEqual( [ 'Two.' ] );
		} );

		it( 'passes what `prepare()` returns to the other hooks, and the task options to the tools', async () => {
			const seen: Array<unknown> = [];
			const task = createTask( {
				prepare: ( { options, phase } ) => ( { prepared: options.option, phase } ),
				scope( { shared } ) {
					seen.push( shared );

					return [ { key: 'k' } ];
				},
				contentHash: ( { shared } ) => {
					seen.push( shared );

					return 'h';
				},
				payload: ( { shared } ) => {
					seen.push( shared );

					return { content: '' };
				},
				judge: ( { shared } ) => {
					seen.push( shared );

					return [];
				}
			} );

			await run( task );

			expect( seen ).toEqual( Array( 4 ).fill( { prepared: true, phase: 'judge' } ) );
		} );

		it( 'keeps the old baseline of units whose hooks failed and lists the errors', async () => {
			await writeFiles( statePath, { 'baseline.json': JSON.stringify( { 'docs/a.md': 'old-a', 'docs/b.md': 'old-b', 'docs/c.md': 'old-c' } ) } );

			const summary = await run( createTask( {
				contentHash: async ( { repo, hash: hashText, unit } ) => {
					if ( unit.key === 'docs/c.md' ) {
						throw new Error( 'No hash.' );
					}

					return hashText( await repo.read( unit.path! ) );
				},
				payload: ( { unit } ) => {
					if ( unit.key === 'docs/a.md' ) {
						throw new Error( 'No payload.' );
					}

					return { content: 'x' };
				},
				judge: () => [ { ruleId: 'X', detail: 'Unknown rule.' } ]
			} ) );

			expect( summary.errors ).toBe( 3 );
			expect( summary.problems ).toEqual( [
				{ unit: 'docs/a.md', message: 'No payload.' },
				{ unit: 'docs/b.md', message: 'Finding #0 refers to the unknown "X" rule.' },
				{ unit: 'docs/c.md', message: 'contentHash() failed: No hash.' }
			] );
			expect( summary.judged ).toBe( 0 );
			expect( await readBaseline() ).toEqual( { 'docs/a.md': 'old-a', 'docs/b.md': 'old-b', 'docs/c.md': 'old-c' } );
		} );

		it( 'records a failed judgment even when its error has no message', async () => {
			const summary = await run( createTask( { judge: () => {
				throw new Error();
			} } ) );

			expect( summary.judged ).toBe( 0 );
			expect( summary.problems ).toEqual( [
				{ unit: 'docs/a.md', message: '' },
				{ unit: 'docs/b.md', message: '' },
				{ unit: 'docs/c.md', message: '' }
			] );
			expect( await readBaseline() ).toEqual( {} );
		} );

		it( 'records the failures of hooks that throw something other than an error', async () => {
			const summary = await run( createTask( {
				contentHash: async ( { repo, hash: hashText, unit } ) => {
					if ( unit.key === 'docs/c.md' ) {
						throw 'No hash.';
					}

					return hashText( await repo.read( unit.path! ) );
				},
				judge: () => {
					throw { toString: () => 'Cannot judge.' };
				}
			} ) );

			expect( summary.errors ).toBe( 3 );
			expect( summary.problems ).toEqual( [
				{ unit: 'docs/a.md', message: 'Cannot judge.' },
				{ unit: 'docs/b.md', message: 'Cannot judge.' },
				{ unit: 'docs/c.md', message: 'contentHash() failed: No hash.' }
			] );
		} );

		it( 'lists a `contentHash()` that throws as an error', async () => {
			const summary = await run( createTask( {
				contentHash: () => {
					throw new Error( 'Nope.' );
				}
			} ) );

			expect( summary.errors ).toBe( 3 );
			expect( summary.problems[ 0 ] ).toEqual( { unit: 'docs/a.md', message: 'contentHash() failed: Nope.' } );
			expect( summary.changed ).toBe( 0 );
		} );

		it( 'throws when `scope()` returns a duplicated key', async () => {
			await expect( run( createTask( { scope: () => [ { key: 'a' }, { key: 'a' } ] } ) ) )
				.rejects.toThrow( '`scope()` returned the "a" unit more than once.' );
		} );

		it( 'sorts the units by key', async () => {
			const keys: Array<string> = [];

			await run( createTask( {
				scope: () => [ { key: 'b' }, { key: 'a' }, { key: 'c' } ],
				contentHash: ( { unit } ) => unit.key,
				payload: () => ( { content: '' } ),
				judge: ( { unit } ) => {
					keys.push( unit.key );

					return [];
				}
			} ) );

			expect( keys ).toEqual( [ 'a', 'b', 'c' ] );
		} );

		it( 'judges up to `concurrency` units at the same time', async () => {
			let active = 0;
			let maxActive = 0;

			await run( createTask( {
				concurrency: 2,
				scope: () => [ 1, 2, 3, 4, 5 ].map( index => ( { key: `u${ index }` } ) ),
				contentHash: ( { unit } ) => unit.key,
				payload: () => ( { content: '' } ),
				async judge() {
					active++;
					maxActive = Math.max( maxActive, active );
					await new Promise( resolve => setTimeout( resolve, 5 ) );
					active--;

					return [];
				}
			} ) );

			expect( maxActive ).toBe( 2 );
		} );

		it( 'drops fixed findings of a reviewed pull request only when asked to', async () => {
			const fixed: Finding = {
				fingerprint: 't|docs/z.md|R1|', id: 'zzzz01', task: 't', unit: 'docs/z.md', ruleId: 'R1', discriminator: '', detail: 'x', fragment: 'f',
				fix: { files: [ 'docs/z.md' ], fragment: 'g', fixedAt: TODAY }
			};

			await writeFiles( statePath, { 'open.json': JSON.stringify( [ fixed ] ) } );
			await run( createTask() );

			expect( ( await readOpen() ).map( finding => finding.unit ) ).toEqual( [ 'docs/b.md', 'docs/z.md' ] );

			const summary = await run( createTask(), { pruneFixed: true } );

			expect( ( await readOpen() ).map( finding => finding.unit ) ).toEqual( [ 'docs/b.md' ] );
			expect( summary.open ).toBe( 1 );
		} );

		it( 'creates the agents with the tools of each phase and sums their usage', async () => {
			const summary = await run( createTask( {
				agent: { model: { provider: 'p', id: 'm' }, judgeTools: [ 'read' ], fixTools: [ 'read', 'bash' ] },
				judge: async ( { agent } ) => {
					await agent.run( { prompt: 'x' } );

					return [];
				}
			} ) );

			expect( summary.cost ).toBe( 1.5 );
			expect( summary.tokens ).toBe( 300 );
			expect( vi.mocked( createAgent ).mock.calls.map( ( [ options ] ) => options.tools ) ).toEqual( [ [ 'read' ], [ 'read', 'bash' ] ] );
			expect( vi.mocked( createAgent ).mock.calls[ 0 ]![ 0 ] ).toMatchObject( {
				taskId: 't',
				taskDirectory: '/tasks/t',
				cwd: upath.normalize( realpathSync( root ) ),
				config: { model: { provider: 'p', id: 'm' } }
			} );
		} );

		it( 'uses the default tools of each phase', async () => {
			await run( createTask() );

			expect( vi.mocked( createAgent ).mock.calls.map( ( [ options ] ) => options.tools ) )
				.toEqual( [ [ 'read', 'grep', 'find', 'ls' ], [ 'read', 'grep', 'find', 'ls', 'edit', 'write' ] ] );
		} );
	} );

	describe( 'fixing', () => {
		it( 'keeps a fix that passes the check in the working tree, reports its files when saving and advances the baseline', async () => {
			const phases: Array<string> = [];
			const { summary, files } = await runSaved( createFixingTask( {
				concurrency: 5,
				async fix( { phase, repo, unit } ) {
					phases.push( phase );
					await repo.write( unit.path!, ( await repo.read( unit.path! ) ).replace( 'BAD', 'GOOD' ) );
				},
				verify: ( { phase } ) => {
					phases.push( phase );
				}
			} ) );

			const realRoot = upath.normalize( realpathSync( root ) );

			expect( summary ).toMatchObject( { newFindings: 1, fixed: 1, discarded: 0, changedFiles: 1, problems: [], open: 0, errors: 0 } );
			expect( phases ).toEqual( [ 'fix', 'verify' ] );
			expect( files ).toEqual( [ `${ realRoot }/docs/b.md` ] );
			expect( await readText( upath.join( root, 'docs/b.md' ) ) ).toBe( 'This is GOOD.\n' );
			expect( ( await readBaseline() )[ 'docs/b.md' ] ).toBe( fileHash( 'This is GOOD.\n' ) );
			expect( ( await readOpen() )[ 0 ] ).toMatchObject( {
				fragment: fileHash( 'This is BAD.\n' ),
				fix: { files: [ 'docs/b.md' ], fragment: fileHash( 'This is GOOD.\n' ), fixedAt: TODAY }
			} );
			expect( await readText( upath.join( statePath, 'report.md' ) ) ).toContain( '## Fixed in the report pull request' );
		} );

		it( 'judges the units in parallel, then fixes them one at a time', async () => {
			root = await createRepository( {
				'docs/a.md': 'This is BAD.\n',
				'docs/b.md': 'This is BAD.\n',
				'docs/c.md': 'Fine.\n',
				'docs/d.md': 'This is BAD.\n'
			} );
			statePath = upath.join( root, '.ai-tasks', 't' );

			const events: Array<string> = [];
			const wait = () => new Promise( resolve => setTimeout( resolve, 10 ) );

			let activeJudges = 0;
			let maxActiveJudges = 0;
			let activeFixes = 0;
			let maxActiveFixes = 0;

			const log = vi.fn();
			const summary = await run( createFixingTask( {
				concurrency: 3,
				async judge( input ) {
					activeJudges++;
					maxActiveJudges = Math.max( maxActiveJudges, activeJudges );
					await wait();
					activeJudges--;
					events.push( `judged ${ input.unit.key }` );

					return createTask().judge( input );
				},
				async fix( { repo, unit } ) {
					activeFixes++;
					maxActiveFixes = Math.max( maxActiveFixes, activeFixes );
					events.push( `fix ${ unit.key }` );
					await wait();
					await repo.write( unit.path!, ( await repo.read( unit.path! ) ).replace( 'BAD', 'GOOD' ) );
					activeFixes--;
				}
			} ), { log } );

			const firstFix = events.findIndex( event => event.startsWith( 'fix ' ) );

			expect( summary ).toMatchObject( { judged: 4, newFindings: 3, fixed: 3, errors: 0 } );

			// Judging runs up to `concurrency` units at a time.
			expect( maxActiveJudges ).toBe( 3 );

			// No fix starts before every unit is judged. The judging after a fix is its check.
			expect( events.slice( 0, firstFix ).filter( event => event.startsWith( 'judged ' ) ) ).toHaveLength( 4 );

			// Fixes never overlap, and run in the order of the units.
			expect( maxActiveFixes ).toBe( 1 );
			expect( events.filter( event => event.startsWith( 'fix ' ) ) ).toEqual( [ 'fix docs/a.md', 'fix docs/b.md', 'fix docs/d.md' ] );

			// Only the units with findings reach the fixing stage.
			expect( log.mock.calls ).toEqual( [
				[ '4 units in scope, 4 changed, 4 taken in this run.' ],
				[ 'Judging 4 units...' ],
				[ 'Fixing 3 units...' ]
			] );
		} );

		it( 'adds the fix to a finding that is already open', async () => {
			await run( createTask() );
			await writeFiles( statePath, { 'baseline.json': '{}' } );

			const summary = await run( createFixingTask() );

			expect( summary ).toMatchObject( { alreadyOpen: 1, newFindings: 0, fixed: 1 } );
			expect( ( await readOpen() )[ 0 ]!.fix ).toMatchObject( { files: [ 'docs/b.md' ] } );
		} );

		it( 'leaves the kept fixes and the state uncommitted in the working tree', async () => {
			const head = git( root, 'rev-parse', 'HEAD' ).trim();

			await run( createFixingTask() );

			expect( git( root, 'rev-parse', 'HEAD' ).trim() ).toBe( head );
			expect( git( root, 'status', '--porcelain', '--untracked-files=all' ).trim().split( '\n' ) ).toEqual( [
				'M docs/b.md',
				'?? .ai-tasks/t/baseline.json',
				'?? .ai-tasks/t/open.json',
				'?? .ai-tasks/t/report.md'
			] );
		} );

		it( 'does not try to fix units without findings, or with rejected findings only', async () => {
			const fix = vi.fn();

			await writeFiles( statePath, {
				'decisions/b.yml': `unit: docs/b.md\nrule: R1\nfragment: ${ fileHash( 'This is BAD.\n' ) }\nreason: Fine.\n`
			} );

			await run( createFixingTask( { fix } ) );

			expect( fix ).not.toHaveBeenCalled();
		} );

		it( 'records the findings without a fix and advances the baseline when the fix changes nothing', async () => {
			const summary = await run( createFixingTask( { fix: () => {} } ) );

			expect( summary ).toMatchObject( { newFindings: 1, fixed: 0, discarded: 0, changedFiles: 0, problems: [] } );
			expect( ( await readOpen() )[ 0 ] ).not.toHaveProperty( 'fix' );
			expect( ( await readBaseline() )[ 'docs/b.md' ] ).toBe( fileHash( 'This is BAD.\n' ) );
		} );

		describe( 'discards the fix', () => {
			const expectDiscarded = async ( task: Task, message: string | RegExp ) => {
				await writeFiles( statePath, { 'baseline.json': JSON.stringify( { 'docs/b.md': 'old' } ) } );

				const summary = await run( task );

				expect( summary.problems ).toEqual( [ { unit: 'docs/b.md', message: expect.stringMatching( /^The fix was discarded\. / ) } ] );
				expect( summary.problems[ 0 ]!.message.replace( /^The fix was discarded\. /, '' ) ).toMatch( message );
				expect( summary ).toMatchObject( { newFindings: 1, fixed: 0, discarded: 1, changedFiles: 0, open: 1 } );
				expect( ( await readOpen() )[ 0 ] ).not.toHaveProperty( 'fix' );
				expect( ( await readBaseline() )[ 'docs/b.md' ] ).toBe( 'old' );
				expect( await readText( upath.join( root, 'docs/b.md' ) ) ).toBe( 'This is BAD.\n' );
				expect( await readText( upath.join( root, 'other.txt' ) ) ).toBe( 'Other.\n' );
				expect( git( root, 'status', '--porcelain', '--', 'docs', 'other.txt' ).trim() ).toBe( '' );
			};

			it.each( [ 1, 2 ] )( 'when collecting changes fails on inspection %s', async inspection => {
				const createTracker = changeTracking.createChangeTracker;

				vi.spyOn( changeTracking, 'createChangeTracker' ).mockImplementationOnce( async root => {
					const tracker = await createTracker( root );
					const collect = tracker.collect;
					let calls = 0;

					vi.spyOn( tracker, 'collect' ).mockImplementation( snapshot => {
						if ( ++calls === inspection ) {
							throw new Error( 'Tracking failed.' );
						}

						return collect( snapshot );
					} );

					return tracker;
				} );

				await expectDiscarded( createFixingTask(), 'Inspecting the fix failed: Tracking failed.' );
			} );

			it( 'when `fix()` throws', async () => {
				await expectDiscarded( createFixingTask( {
					async fix( { repo, unit } ) {
						await repo.write( unit.path!, 'Half-way.\n' );

						throw new Error( 'Boom.' );
					}
				} ), /^`fix\(\)` failed: Boom\.$/ );
			} );

			it( 'when it changes files outside of `writes`', async () => {
				await expectDiscarded( createFixingTask( {
					async fix( { repo, unit } ) {
						await repo.write( unit.path!, 'This is GOOD.\n' );
						await repo.write( 'other.txt', 'Changed.\n' );
					}
				} ), /^The fix changed files outside `writes`: `other\.txt`\.$/ );
			} );

			it( 'when it changes files outside of the target root', async () => {
				await writeFiles( root, { 'nested/docs/b.md': 'This is BAD.\n' } );
				git( root, 'add', '--all' );
				git( root, 'commit', '--quiet', '--message', 'Nested.' );

				const nestedRoot = upath.join( root, 'nested' );
				const summary = await run( createFixingTask( {
					async fix( { repo, exec, unit } ) {
						await repo.write( unit.path!, 'This is GOOD.\n' );
						await exec( process.execPath, [ '-e', 'require( "fs" ).writeFileSync( "../other.txt", "Changed.\\n" );' ] );
					}
				} ), { root: nestedRoot } );

				expect( summary.problems ).toEqual( [
					{ unit: 'docs/b.md', message: 'The fix was discarded. The fix changed files outside `writes`: `../other.txt`.' }
				] );
				expect( await readText( upath.join( root, 'other.txt' ) ) ).toBe( 'Other.\n' );
			} );

			it( 'when it creates a commit', async () => {
				const head = git( root, 'rev-parse', 'HEAD' ).trim();

				await expectDiscarded( createFixingTask( {
					async fix( { repo, exec, unit } ) {
						await repo.write( unit.path!, 'This is GOOD.\n' );
						await exec( 'git', [ '-c', 'user.name=x', '-c', 'user.email=x@x', 'commit', '--quiet', '--all', '--message', 'x' ] );
					}
				} ), /^The fix created commits\. Only the harness may commit\.$/ );

				expect( git( root, 'rev-parse', 'HEAD' ).trim() ).toBe( head );
			} );

			it( 'when judging the fixed unit fails', async () => {
				await expectDiscarded( createFixingTask( {
					judge( input ) {
						if ( input.payload.content.includes( 'GOOD' ) ) {
							throw new Error( 'Cannot judge.' );
						}

						return createTask().judge( input );
					}
				} ), /^Judging the fixed unit failed: Cannot judge\.$/ );
			} );

			it( 'when hashing the fixed unit fails', async () => {
				await expectDiscarded( createFixingTask( {
					async contentHash( { repo, hash: hashText, unit } ) {
						const content = await repo.read( unit.path! );

						if ( content.includes( 'GOOD' ) ) {
							throw new Error( 'No hash.' );
						}

						return hashText( content );
					}
				} ), /^Judging the fixed unit failed: `contentHash\(\)` of "docs\/b\.md" failed: No hash\.$/ );
			} );

			it( 'when the fix introduces a new finding', async () => {
				await expectDiscarded( createFixingTask( {
					async fix( { repo, unit } ) {
						await repo.write( unit.path!, 'This is UGLY.\n' );
					}
				} ), /^The fix introduced new findings: R2\.$/ );
			} );

			it( 'when the fix resolves nothing', async () => {
				await expectDiscarded( createFixingTask( {
					async fix( { repo, unit } ) {
						await repo.write( unit.path!, 'This is still BAD.\n' );
					}
				} ), /^The fix did not resolve any finding\.$/ );
			} );

			it( 'when `verify()` throws', async () => {
				await expectDiscarded( createFixingTask( {
					async verify( { exec } ) {
						await exec( process.execPath, [ '-e', 'console.log( "tests failed" ); process.exit( 1 );' ] );
					}
				} ), /^`verify\(\)` failed: .* exited with code 1:\ntests failed\n$/s );
			} );

			it( 'when `verify()` changes files outside of `writes`', async () => {
				await expectDiscarded( createFixingTask( {
					async verify( { repo } ) {
						await repo.write( 'other.txt', 'Changed by verify.\n' );
					}
				} ), /^The fix changed files outside `writes`: `other\.txt`\.$/ );
			} );
		} );

		it( 'keeps a fix when hashing another unit failed before the fix', async () => {
			const summary = await run( createFixingTask( {
				async contentHash( { repo, hash: hashText, unit } ) {
					if ( unit.key === 'docs/c.md' ) {
						throw new Error( 'No hash.' );
					}

					return hashText( await repo.read( unit.path! ) );
				}
			} ) );

			expect( summary ).toMatchObject( { fixed: 1, discarded: 0, errors: 1 } );
			expect( summary.problems ).toEqual( [ { unit: 'docs/c.md', message: 'contentHash() failed: No hash.' } ] );
			expect( await readText( upath.join( root, 'docs/b.md' ) ) ).toBe( 'This is GOOD.\n' );
		} );

		it( 'keeps a fix when a new finding is rejected by a decision about the fixed content', async () => {
			await writeFiles( statePath, {
				'decisions/c.yml': `unit: docs/b.md\nrule: R2\nfragment: ${ fileHash( 'This is UGLY.\n' ) }\nreason: Ugly is fine.\n`
			} );

			const summary = await run( createFixingTask( {
				async fix( { repo, unit } ) {
					await repo.write( unit.path!, 'This is UGLY.\n' );
				}
			} ) );

			expect( summary ).toMatchObject( { fixed: 1, problems: [] } );
		} );

		it( 'keeps a fix that changes a unit whose other finding a human rejected', async () => {
			// The decision rejects R2 for the content before the fix. The fix resolves R1 only, so R2 is still there
			// after it, for the changed content.
			await writeFiles( root, { 'docs/b.md': 'This is BAD and UGLY.\n' } );
			git( root, 'commit', '--quiet', '--all', '--message', 'Both.' );
			await writeFiles( statePath, {
				'decisions/r2.yml': `unit: docs/b.md\nrule: R2\nfragment: ${ fileHash( 'This is BAD and UGLY.\n' ) }\nreason: Ugly is fine.\n`
			} );

			const summary = await run( createFixingTask() );

			expect( summary ).toMatchObject( { newFindings: 1, rejected: 1, fixed: 1, discarded: 0, problems: [] } );
			expect( await readText( upath.join( root, 'docs/b.md' ) ) ).toBe( 'This is GOOD and UGLY.\n' );
			expect( ( await readOpen() ).map( finding => [ finding.ruleId, Boolean( finding.fix ) ] ) ).toEqual( [ [ 'R1', true ] ] );
			expect( ( await readBaseline() )[ 'docs/b.md' ] ).toBe( fileHash( 'This is GOOD and UGLY.\n' ) );
		} );

		it( 'keeps a partial fix and marks only the resolved findings as fixed', async () => {
			await writeFiles( root, { 'docs/b.md': 'This is BAD and UGLY.\n' } );
			git( root, 'commit', '--quiet', '--all', '--message', 'Both.' );

			const summary = await run( createFixingTask() );
			const open = await readOpen();

			// One file resolved one of its two findings: the counts of findings and of files differ.
			expect( summary ).toMatchObject( { newFindings: 2, fixed: 1, discarded: 0, changedFiles: 1, open: 1 } );
			expect( open.find( finding => finding.ruleId === 'R1' )!.fix ).toBeDefined();
			expect( open.find( finding => finding.ruleId === 'R2' ) ).not.toHaveProperty( 'fix' );
			expect( ( await readBaseline() )[ 'docs/b.md' ] ).toBe( fileHash( 'This is GOOD and UGLY.\n' ) );
		} );

		it( 'counts the fixed findings and the changed files separately', async () => {
			root = await createRepository( {
				'docs/a.md': 'This is BAD.\n',
				'docs/b.md': 'This is BAD and UGLY.\n',
				'docs/log/changes.md': 'Changes:\n'
			} );
			statePath = upath.join( root, '.ai-tasks', 't' );

			// Every fix also records itself in one shared file, which is not a unit.
			const summary = await run( createFixingTask( {
				async fix( { repo, unit } ) {
					const content = await repo.read( unit.path! );

					await repo.write( unit.path!, content.replace( 'BAD', 'GOOD' ).replace( 'UGLY', 'PRETTY' ) );
					await repo.write( 'docs/log/changes.md', `${ await repo.read( 'docs/log/changes.md' ) }${ unit.key }\n` );
				}
			} ) );

			// Three findings in two guides, fixed by changing three files, the shared one only once.
			expect( summary ).toMatchObject( { newFindings: 3, fixed: 3, discarded: 0, changedFiles: 3, open: 0 } );
		} );

		it( 'checks the final content after a writable verifier', async () => {
			const summary = await run( createFixingTask( {
				async verify( { repo, unit } ) {
					await repo.write( unit.path!, 'This is BAD again.\n' );
				}
			} ) );

			expect( summary ).toMatchObject( { fixed: 0, discarded: 1 } );
			expect( await readText( upath.join( root, 'docs/b.md' ) ) ).toBe( 'This is BAD.\n' );
			expect( await readBaseline() ).not.toHaveProperty( 'docs/b.md' );
		} );

		it( 'discards commits created by verification and restores HEAD', async () => {
			const head = git( root, 'rev-parse', 'HEAD' );
			const summary = await run( createFixingTask( {
				verify() {
					git( root, 'commit', '--quiet', '--all', '--message', 'Verifier commit.' );
				}
			} ) );

			expect( summary ).toMatchObject( { fixed: 0, discarded: 1 } );
			expect( git( root, 'rev-parse', 'HEAD' ) ).toBe( head );
			expect( await readText( upath.join( root, 'docs/b.md' ) ) ).toBe( 'This is BAD.\n' );
		} );

		it( 'discards a later fix that invalidates an earlier accepted fix', async () => {
			await writeFiles( root, { 'docs/a.md': 'BAD', 'docs/b.md': 'BAD' } );
			const summary = await run( createFixingTask( {
				async fix( { repo, unit } ) {
					await repo.write( unit.path!, 'GOOD' );

					if ( unit.path === 'docs/b.md' ) {
						await repo.write( 'docs/a.md', 'BAD' );
					}
				}
			} ) );

			expect( summary ).toMatchObject( { fixed: 1, discarded: 1, open: 1 } );
			expect( await readText( upath.join( root, 'docs/a.md' ) ) ).toBe( 'GOOD' );
			expect( await readText( upath.join( root, 'docs/b.md' ) ) ).toBe( 'BAD' );
			expect( ( await readOpen() ).filter( finding => finding.fix ) ).toHaveLength( 1 );
		} );

		it( 'marks findings resolved by another unit as fixed without fixing that unit again', async () => {
			await writeFiles( root, { 'docs/a.md': 'BAD', 'docs/b.md': 'BAD' } );
			const fix = vi.fn( async ( { repo }: FixInput ) => {
				await repo.write( 'docs/a.md', 'GOOD' );
				await repo.write( 'docs/b.md', 'GOOD' );
			} );
			const summary = await run( createFixingTask( { fix } ) );

			expect( fix ).toHaveBeenCalledOnce();
			expect( summary ).toMatchObject( { fixed: 2, open: 0 } );
			expect( ( await readOpen() ).every( finding => finding.fix ) ).toBe( true );
			expect( await readBaseline() ).toMatchObject( { 'docs/a.md': hash( 'GOOD' ), 'docs/b.md': hash( 'GOOD' ) } );
		} );

		it( 'updates the final hash when a later fix changes an earlier unit without introducing a finding', async () => {
			await writeFiles( root, { 'docs/a.md': 'BAD', 'docs/b.md': 'BAD' } );
			const summary = await run( createFixingTask( {
				async fix( { repo, unit } ) {
					await repo.write( unit.path!, 'GOOD' );

					if ( unit.path === 'docs/b.md' ) {
						await repo.write( 'docs/a.md', 'Still GOOD' );
					}
				}
			} ) );

			expect( summary.fixed ).toBe( 2 );
			expect( ( await readBaseline() )[ 'docs/a.md' ] ).toBe( hash( 'Still GOOD' ) );
			expect( ( await readOpen() ).find( finding => finding.unit === 'docs/a.md' )!.fix!.fragment ).toBe( hash( 'Still GOOD' ) );
		} );

		it( 'checks a previously skipped unit against its original content and discards a new finding in it', async () => {
			await run( createTask() );
			await writeFiles( root, { 'docs/b.md': 'Changed BAD' } );
			const summary = await run( createFixingTask( {
				async fix( { repo } ) {
					await repo.write( 'docs/b.md', 'GOOD' );
					await repo.write( 'docs/a.md', 'BAD' );
				}
			} ) );

			expect( summary ).toMatchObject( { judged: 1, fixed: 0, discarded: 1 } );
			expect( await readText( upath.join( root, 'docs/a.md' ) ) ).toBe( 'Fine.\n' );
			expect( await readText( upath.join( root, 'docs/b.md' ) ) ).toBe( 'Changed BAD' );
		} );

		it( 'supports multi-unit fixes across a batch boundary without advancing the deferred baseline', async () => {
			await writeFiles( root, { 'docs/a.md': 'BAD', 'docs/b.md': 'BAD' } );
			const summary = await run( createFixingTask( {
				async fix( { repo } ) {
					await repo.write( 'docs/a.md', 'GOOD' );
					await repo.write( 'docs/b.md', 'GOOD' );
				}
			} ), { maxUnits: 1 } );

			expect( summary ).toMatchObject( { judged: 1, fixed: 1, deferred: 2, discarded: 0 } );
			expect( await readBaseline() ).toEqual( { 'docs/a.md': hash( 'GOOD' ) } );
			expect( await readText( upath.join( root, 'docs/b.md' ) ) ).toBe( 'GOOD' );
		} );

		it( 'marks an existing finding fixed when it is resolved outside the selected batch', async () => {
			await writeFiles( root, { 'docs/a.md': 'BAD', 'docs/b.md': 'BAD' } );
			await run( createTask() );
			await writeFiles( root, { 'docs/a.md': 'Changed BAD', 'docs/b.md': 'Changed BAD' } );
			const summary = await run( createFixingTask( {
				async fix( { repo } ) {
					await repo.write( 'docs/a.md', 'GOOD' );
					await repo.write( 'docs/b.md', 'GOOD' );
				}
			} ), { maxUnits: 1 } );

			expect( summary ).toMatchObject( { judged: 1, fixed: 2, deferred: 1, open: 0 } );
			expect( ( await readOpen() ).every( finding => finding.fix?.fragment === hash( 'GOOD' ) ) ).toBe( true );
			expect( ( await readBaseline() )[ 'docs/b.md' ] ).toBe( hash( 'BAD' ) );
		} );

		it( 'checks dependencies defined by contentHash even when the unit file was not changed', async () => {
			const base = createTask();
			const summary = await run( createFixingTask( {
				async contentHash( input ) {
					return hash( ( await base.contentHash( input ) ) + await input.repo.read( 'docs/b.md' ) );
				},
				async payload( { repo, unit } ) {
					return { content: unit.path === 'docs/a.md' ? ( await repo.read( 'docs/b.md' ) ).replace( 'GOOD', 'UGLY' ) : await repo.read( unit.path! ) };
				}
			} ) );

			expect( summary ).toMatchObject( { fixed: 0, discarded: 1 } );
			expect( await readText( upath.join( root, 'docs/b.md' ) ) ).toBe( 'This is BAD.\n' );
		} );

		it( 'gives every hook exactly the documented input of its phase', async () => {
			const inputs = new Map<string, Record<string, unknown>>();
			const record = ( hook: string, input: object ) => {
				if ( !inputs.has( hook ) ) {
					inputs.set( hook, input as Record<string, unknown> );
				}
			};
			const base = createFixingTask();
			const keysOf = ( hook: string ) => Object.keys( inputs.get( hook )! ).sort();
			const repoOf = ( hook: string ) => Object.keys( inputs.get( hook )!.repo as object ).sort();
			const tools = [ 'agent', 'hash', 'log', 'normalise', 'options', 'phase', 'repo' ];

			await run( createFixingTask( {
				prepare: input => {
					record( 'prepare', input );

					return { shared: true };
				},
				scope: input => {
					record( 'scope', input );

					return base.scope!( input );
				},
				contentHash: input => {
					record( 'contentHash', input );

					return base.contentHash( input );
				},
				payload: input => {
					record( 'payload', input );

					return base.payload( input );
				},
				judge: input => {
					record( 'judge', input );

					return base.judge( input );
				},
				fix: input => {
					record( 'fix', input );

					return base.fix!( input );
				},
				verify: input => {
					record( 'verify', input );
				}
			} ) );

			expect( keysOf( 'prepare' ) ).toEqual( tools );
			expect( keysOf( 'scope' ) ).toEqual( [ ...tools, 'exclude', 'include', 'shared' ].sort() );
			expect( keysOf( 'contentHash' ) ).toEqual( [ ...tools, 'shared', 'unit' ].sort() );
			expect( keysOf( 'payload' ) ).toEqual( [ ...tools, 'shared', 'unit' ].sort() );
			expect( keysOf( 'judge' ) ).toEqual( [ ...tools, 'payload', 'priorDecisions', 'shared', 'unit' ].sort() );
			expect( keysOf( 'fix' ) ).toEqual( [ ...tools, 'exec', 'findings', 'shared', 'unit' ].sort() );
			expect( keysOf( 'verify' ) ).toEqual( [ ...tools, 'exec', 'shared', 'unit' ].sort() );

			expect( repoOf( 'judge' ) ).toEqual( [ 'list', 'read', 'root' ] );
			expect( repoOf( 'fix' ) ).toEqual( [ 'list', 'read', 'remove', 'root', 'write' ] );
			expect( repoOf( 'verify' ) ).toEqual( [ 'list', 'read', 'remove', 'root', 'write' ] );

			expect( inputs.get( 'judge' )!.shared ).toEqual( { shared: true } );
			expect( inputs.get( 'judge' )!.phase ).toBe( 'judge' );
			expect( inputs.get( 'fix' )!.phase ).toBe( 'fix' );
			expect( inputs.get( 'verify' )!.phase ).toBe( 'verify' );
		} );

		it( 'passes the actionable findings to `fix()` in the fix phase', async () => {
			const fix = vi.fn<( input: FixInput ) => Promise<void>>( async () => {} );

			await run( createFixingTask( { fix } ) );

			expect( fix ).toHaveBeenCalledOnce();

			const [ { phase, repo, findings } ] = fix.mock.calls[ 0 ]!;

			expect( phase ).toBe( 'fix' );
			expect( repo.root ).toBe( upath.normalize( realpathSync( root ) ) );
			expect( findings.map( finding => finding.fingerprint ) ).toEqual( [ 't|docs/b.md|R1|' ] );
		} );
	} );
} );
