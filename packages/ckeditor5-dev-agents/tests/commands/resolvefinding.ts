/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-disable @stylistic/max-len */

import { afterEach, beforeEach, describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import upath from 'upath';
import { renderResolvedFinding, resolveFinding, type ResolveFindingOptions, type ResolvedFinding } from '../../src/commands/resolvefinding.js';
import { runTasks } from '../../src/runtasks.js';
import { getFindingId } from '../../src/runner/validatefindings.js';
import { hash } from '../../src/utils/text.js';
import { createTempDirectory, readJson, readText, removeTempDirectories, writeFiles } from '../_utils/files.js';
import { createCheckout, createRemote, createRepository, git, isolateGit } from '../_utils/git.js';
import type { Finding } from '../../src/types.js';

// A task that finds `BAD` (R1) and `UGLY` (R2) in `docs/*.md`, fixes both, and records every fix in `log.md`,
// a file all fixes share.
function fixingTask( id: string, { log = 'log.md', create = false }: { log?: string; create?: boolean } = {} ): string {
	return `export default {
		id: '${ id }',
		title: 'Task ${ id }',
		ruleIds: [ 'R1', 'R2' ],
		writes: [ 'docs/**', '*.md' ],
		async scope( { repo } ) { return ( await repo.list( [ 'docs/*.md' ] ) ).map( path => ( { key: path, path } ) ); },
		async contentHash( { repo, hash, unit } ) { return hash( await repo.read( unit.path ) ); },
		async payload( { repo, unit } ) { return { content: await repo.read( unit.path ) }; },
		judge( { payload } ) {
			const findings = [];
			if ( payload.content.includes( 'BAD' ) ) { findings.push( { ruleId: 'R1', detail: 'Bad.' } ); }
			if ( payload.content.includes( 'UGLY' ) ) { findings.push( { ruleId: 'R2', detail: 'Ugly.' } ); }
			return findings;
		},
		async fix( { repo, unit } ) {
			await repo.write( unit.path, ( await repo.read( unit.path ) ).replace( 'BAD', 'GOOD' ).replace( 'UGLY', 'PRETTY' ) );
			await repo.write( '${ log }', \`\${ await repo.read( '${ log }' ) }${ id } \${ unit.key }\\n\` );
			${ create ? 'await repo.write( unit.path.replace( ".md", ".created.txt" ), "Created.\\n" );' : '' }
		}
	};\n`;
}

// A task that finds nothing and fixes nothing. Only its state matters.
const QUIET_TASK = `export default {
	id: 'quiet',
	title: 'Quiet',
	ruleIds: [ 'Q1' ],
	scope() { return []; },
	contentHash() { return 'x'; },
	payload() { return {}; },
	judge() { return []; }
};\n`;

describe( 'resolveFinding()', () => {
	let root: string;
	let configPath: string;

	// Node caches the modules by their URL, so a changed config goes to a new directory.
	const useConfig = async ( files: Record<string, string> ) => {
		configPath = await createTempDirectory();

		await writeFiles( configPath, files );
	};

	beforeEach( async () => {
		await isolateGit();

		root = await createRepository( {
			'docs/a.md': 'This is BAD.\n',
			'docs/b.md': 'This is BAD and UGLY.\n',
			'docs/c.md': 'This is fine.\n',
			'log.md': 'Log:\n',
			'other.md': 'Other:\n'
		} );
		git( root, 'remote', 'add', 'origin', 'git@github.com:owner/repo.git' );

		await useConfig( {
			'tasks/t/index.mjs': fixingTask( 't' ),
			'targets/repo.mjs': 'export default { slug: \'owner/repo\', tasks: { t: {} } };\n'
		} );
	} );

	afterEach( removeTempDirectories );

	const author = { name: 'Bot', email: 'bot@example.com' };
	const runIn = ( cwd: string, tasks: Array<string> = [] ) => runTasks( { configPath, cwd, targets: [], tasks, author, log: () => {} } );
	const run = async () => {
		await runIn( root );
	};
	const resolve = ( options: Pick<ResolveFindingOptions, 'action' | 'id'> & Partial<ResolveFindingOptions> ) => {
		return resolveFinding( { force: false, configPath, cwd: root, targets: [], tasks: [], ...options } );
	};

	const statePath = ( task = 't' ) => upath.join( root, '.ai-tasks', task );
	const readOpen = ( task = 't' ) => readJson<Array<Finding>>( upath.join( statePath( task ), 'open.json' ) );
	const readBaseline = ( task = 't' ) => readJson<Record<string, string>>( upath.join( statePath( task ), 'baseline.json' ) );
	const read = ( path: string ) => readText( upath.join( root, path ) );
	const idOf = ( unit: string, ruleId: string, task = 't' ) => hash( `${ task }|${ unit }|${ ruleId }|` );

	// Writes a state for `t` in which the findings of `docs/a.md` (R1) and `docs/c.md` (R1) are open without a fix.
	const writeUnfixedState = async () => {
		await writeFiles( statePath(), {
			'open.json': JSON.stringify( [ 'docs/a.md', 'docs/c.md' ].map( unit => ( {
				fingerprint: `t|${ unit }|R1|`,
				id: hash( `t|${ unit }|R1|` ),
				task: 't',
				unit,
				ruleId: 'R1',
				discriminator: '',
				detail: 'Bad.',
				fragment: `hash-of-${ unit }`,
				path: unit
			} ) ) ),
			'baseline.json': JSON.stringify( { 'docs/a.md': 'hash-of-docs/a.md', 'docs/c.md': 'hash-of-docs/c.md' } )
		} );
	};

	describe( 'a finding with a fix', () => {
		beforeEach( async () => {
			// Only one guide has findings, so its fix is the only one that changes `log.md`.
			await writeFiles( root, { 'docs/b.md': 'This is fine.\n' } );
			git( root, 'commit', '--quiet', '--all', '--message', 'Only a.md is bad.' );
			await run();
		} );

		it( 'rejects it: restores the files of the fix, records the decision, drops the finding and its baseline entry', async () => {
			expect( await read( 'docs/a.md' ) ).toBe( 'This is GOOD.\n' );

			const result = await resolve( { action: 'reject', id: idOf( 'docs/a.md', 'R1' ), reason: 'Bad is fine here.', configPath, cwd: root } );

			expect( result ).toMatchObject( {
				action: 'reject',
				target: 'repo',
				decisionFile: '.ai-tasks/t/decisions/r1-docs-a.yml',
				revertedFiles: [ 'docs/a.md', 'log.md' ],
				reopened: []
			} );
			expect( result.finding ).toMatchObject( { task: 't', unit: 'docs/a.md', ruleId: 'R1' } );
			expect( result.finding ).not.toHaveProperty( 'fix' );

			expect( await read( 'docs/a.md' ) ).toBe( 'This is BAD.\n' );
			expect( await read( 'log.md' ) ).toBe( 'Log:\n' );
			expect( await readOpen() ).toEqual( [] );
			expect( await readBaseline() ).not.toHaveProperty( 'docs/a.md' );
			expect( await readBaseline() ).toHaveProperty( 'docs/b.md' );
			expect( await read( '.ai-tasks/t/decisions/r1-docs-a.yml' ) ).toContain( 'reason: Bad is fine here.' );
			expect( await read( '.ai-tasks/t/report.md' ) ).toContain( 'There are no findings.' );

			// Nothing is committed.
			expect( git( root, 'log', '--format=%s' ).trim().split( '\n' ) ).toHaveLength( 2 );
		} );

		it( 'keeps it rejected on the next run, while the content is the same', async () => {
			await resolve( { action: 'reject', id: idOf( 'docs/a.md', 'R1' ), reason: 'Fine.', configPath, cwd: root } );
			await run();

			expect( await readOpen() ).toEqual( [] );
			expect( await read( 'docs/a.md' ) ).toBe( 'This is BAD.\n' );
		} );

		it( 'dismisses it: the same without a decision, so the next run finds and fixes it again', async () => {
			const result = await resolve( { action: 'dismiss', id: idOf( 'docs/a.md', 'R1' ), configPath, cwd: root } );

			expect( result.decisionFile ).toBeUndefined();
			expect( existsSync( upath.join( statePath(), 'decisions' ) ) ).toBe( false );
			expect( await read( 'docs/a.md' ) ).toBe( 'This is BAD.\n' );
			expect( await readOpen() ).toEqual( [] );

			await run();

			expect( await read( 'docs/a.md' ) ).toBe( 'This is GOOD.\n' );
			expect( ( await readOpen() )[ 0 ] ).toMatchObject( { unit: 'docs/a.md', fix: { files: [ 'docs/a.md', 'log.md' ] } } );
		} );

		it( 'restores from `HEAD` and links the report to `HEAD` when `HEAD` is detached', async () => {
			git( root, 'checkout', '--quiet', '--detach' );

			await resolve( { action: 'dismiss', id: idOf( 'docs/a.md', 'R1' ), configPath, cwd: root } );

			expect( await read( 'docs/a.md' ) ).toBe( 'This is BAD.\n' );
			expect( await read( '.ai-tasks/t/report.md' ) ).toContain( '# Task t' );
		} );

		it( 'deletes a file the fix created', async () => {
			await resolve( { action: 'dismiss', id: idOf( 'docs/a.md', 'R1' ), configPath, cwd: root } );
			await useConfig( {
				'tasks/t/index.mjs': fixingTask( 't', { create: true } ),
				'targets/repo.mjs': 'export default { slug: \'owner/repo\', tasks: { t: {} } };\n'
			} );
			await run();

			expect( await read( 'docs/a.created.txt' ) ).toBe( 'Created.\n' );

			const result = await resolve( { action: 'dismiss', id: idOf( 'docs/a.md', 'R1' ), configPath, cwd: root } );

			expect( result.revertedFiles ).toEqual( [ 'docs/a.created.txt', 'docs/a.md', 'log.md' ] );
			expect( existsSync( upath.join( root, 'docs/a.created.txt' ) ) ).toBe( false );
			expect( git( root, 'status', '--porcelain', '--', 'docs', 'log.md' ).trim() ).toBe( '' );
		} );
	} );

	describe( 'a finding without a fix', () => {
		it( 'reverts nothing and keeps the baseline entry of its unit', async () => {
			await writeUnfixedState();

			const result = await resolve( { action: 'reject', id: idOf( 'docs/a.md', 'R1' ), reason: 'Fine.', configPath, cwd: root } );

			expect( result.revertedFiles ).toEqual( [] );
			expect( result.reopened ).toEqual( [] );
			expect( await readOpen() ).toEqual( [ expect.objectContaining( { unit: 'docs/c.md' } ) ] );
			expect( await readBaseline() ).toEqual( { 'docs/a.md': 'hash-of-docs/a.md', 'docs/c.md': 'hash-of-docs/c.md' } );
			expect( await read( '.ai-tasks/t/decisions/r1-docs-a.yml' ) ).toContain( 'fragment: hash-of-docs/a.md' );
			expect( git( root, 'status', '--porcelain', '--', 'docs', 'log.md' ).trim() ).toBe( '' );
		} );

		it( 'adds a suffix when a decision file with the same name exists', async () => {
			await writeUnfixedState();
			await writeFiles( statePath(), { 'decisions/r1-docs-a.yml': 'taken', 'decisions/r1-docs-a-2.yml': 'taken' } );

			const result = await resolve( { action: 'reject', id: idOf( 'docs/a.md', 'R1' ), reason: 'Fine.', configPath, cwd: root } );

			expect( result.decisionFile ).toBe( '.ai-tasks/t/decisions/r1-docs-a-3.yml' );
			expect( await read( '.ai-tasks/t/decisions/r1-docs-a.yml' ) ).toBe( 'taken' );
		} );
	} );

	describe( 'fixes that share files', () => {
		beforeEach( run );

		it( 'changes nothing without `force` and lists the fixes that would be undone', async () => {
			const before = {
				files: await Promise.all( [ 'docs/a.md', 'docs/b.md', 'log.md' ].map( read ) ),
				open: await readOpen(),
				baseline: await readBaseline()
			};
			const id = idOf( 'docs/a.md', 'R1' );

			await expect( resolve( { action: 'reject', id, reason: 'Fine.', configPath, cwd: root } ) ).rejects.toThrow( [
				`Reverting the fix of [${ id }] also undoes these fixes, because they changed the same files:`,
				`  [${ idOf( 'docs/b.md', 'R1' ) }] R1 in docs/b.md (t): docs/b.md, log.md`,
				`  [${ idOf( 'docs/b.md', 'R2' ) }] R2 in docs/b.md (t): docs/b.md, log.md`,
				'Nothing was changed. Re-run with "--force" to revert them too. Their findings then stay open, ' +
					'and the next run judges and fixes them again.'
			].join( '\n' ) );

			expect( await Promise.all( [ 'docs/a.md', 'docs/b.md', 'log.md' ].map( read ) ) ).toEqual( before.files );
			expect( await readOpen() ).toEqual( before.open );
			expect( await readBaseline() ).toEqual( before.baseline );
			expect( existsSync( upath.join( statePath(), 'decisions' ) ) ).toBe( false );
		} );

		it( 'with `force`, undoes every fix that shares a file, directly or through another fix, and reopens their findings', async () => {
			const result = await resolve( { action: 'reject', id: idOf( 'docs/a.md', 'R1' ), reason: 'Fine.', force: true, configPath, cwd: root } );

			expect( result.revertedFiles ).toEqual( [ 'docs/a.md', 'docs/b.md', 'log.md' ] );
			expect( result.reopened.map( item => item.id ) ).toEqual( [ idOf( 'docs/b.md', 'R1' ), idOf( 'docs/b.md', 'R2' ) ] );
			expect( result.reopened[ 0 ] ).toMatchObject( { task: 't', unit: 'docs/b.md' } );
			expect( result.reopened[ 0 ] ).not.toHaveProperty( 'fix' );

			expect( await Promise.all( [ 'docs/a.md', 'docs/b.md', 'log.md' ].map( read ) ) )
				.toEqual( [ 'This is BAD.\n', 'This is BAD and UGLY.\n', 'Log:\n' ] );

			const open = await readOpen();

			expect( open.map( finding => `${ finding.unit } ${ finding.ruleId }` ) ).toEqual( [ 'docs/b.md R1', 'docs/b.md R2' ] );
			expect( open.every( finding => !finding.fix ) ).toBe( true );
			expect( await readBaseline() ).toEqual( { 'docs/c.md': expect.any( String ) } );
			expect( await read( '.ai-tasks/t/report.md' ) ).toContain( '**2** open findings, **0** fixed' );

			// The next run fixes the reopened findings again. The rejected one stays rejected.
			await run();

			expect( await read( 'docs/b.md' ) ).toBe( 'This is GOOD and PRETTY.\n' );
			expect( await read( 'docs/a.md' ) ).toBe( 'This is BAD.\n' );
		} );

		it( 'reverts fixes of other tasks that changed the same files, and saves their states too', async () => {
			await useConfig( {
				'tasks/t/index.mjs': fixingTask( 't' ),
				'tasks/u/index.mjs': fixingTask( 'u' ),
				'targets/repo.mjs': 'export default { slug: \'owner/repo\', tasks: { t: {}, u: {} } };\n'
			} );

			// Task `t` fixed everything already, so `u` judges the fixed guides. Give it something of its own.
			await writeFiles( root, { 'docs/d.md': 'BAD again.\n' } );
			git( root, 'add', 'docs/d.md' );
			git( root, 'commit', '--quiet', '--message', 'Add d.md.' );
			await runIn( root, [ 'u' ] );

			const id = idOf( 'docs/d.md', 'R1', 'u' );

			await expect( resolve( { action: 'dismiss', id, configPath, cwd: root } ) ).rejects.toThrow( '(t): docs/a.md, log.md' );

			const result = await resolve( { action: 'dismiss', id, force: true, configPath, cwd: root } );

			expect( result.finding.task ).toBe( 'u' );
			expect( result.reopened.map( item => item.task ) ).toEqual( [ 't', 't', 't' ] );
			expect( ( await readOpen() ).every( finding => !finding.fix ) ).toBe( true );
			expect( await readOpen( 'u' ) ).toEqual( [] );
			expect( await read( 'docs/d.md' ) ).toBe( 'BAD again.\n' );
		} );

		it( 'skips the tasks that were not selected, and the tasks without a state', async () => {
			await useConfig( {
				'tasks/t/index.mjs': fixingTask( 't' ),
				'tasks/u/index.mjs': fixingTask( 'u' ),
				'targets/repo.mjs': 'export default { slug: \'owner/repo\', tasks: { t: {}, u: {} } };\n'
			} );

			// Task `u` never ran, so it has no state.
			expect( existsSync( statePath( 'u' ) ) ).toBe( false );

			const selected = await resolve( { action: 'dismiss', id: idOf( 'docs/a.md', 'R1' ), force: true, tasks: [ 't' ], configPath, cwd: root } );

			expect( selected.finding.task ).toBe( 't' );

			const all = await resolve( { action: 'dismiss', id: idOf( 'docs/b.md', 'R1' ), configPath, cwd: root } );

			expect( all.finding.task ).toBe( 't' );
			expect( existsSync( statePath( 'u' ) ) ).toBe( false );
		} );
	} );

	describe( 'on a report branch', () => {
		let remote: string;
		let checkout: string;

		beforeEach( async () => {
			( { remote } = await createRemote( { 'docs/a.md': 'This is BAD.\n', 'log.md': 'Log:\n' } ) );
			checkout = await createCheckout( remote );

			// The remote-tracking branch has the content of the base branch. The local base branch has moved on.
			await writeFiles( checkout, { 'docs/a.md': 'This is LOCAL.\n' } );
			git( checkout, 'commit', '--quiet', '--all', '--message', 'Local change.' );
			git( checkout, 'checkout', '--quiet', '-b', 'ai-tasks/t/repo/stable', 'origin/stable' );
			git( checkout, 'remote', 'set-url', 'origin', 'git@github.com:owner/repo.git' );

			await runIn( checkout );
			git( checkout, 'add', '--all' );
			git( checkout, 'commit', '--quiet', '--message', 'Task t: 1 unit judged.' );
		} );

		it( 'restores the files from the remote-tracking base branch first', async () => {
			await resolve( { action: 'dismiss', id: idOf( 'docs/a.md', 'R1' ), configPath, cwd: checkout } );

			expect( await readText( upath.join( checkout, 'docs/a.md' ) ) ).toBe( 'This is BAD.\n' );
		} );

		it( 'links the report to the base branch, not to the report branch', async () => {
			const openPath = upath.join( checkout, '.ai-tasks/t/open.json' );
			const [ fixed ] = await readJson<Array<Finding>>( openPath );
			const other = { ...fixed!, fingerprint: 't|docs/z.md|R1|', id: hash( 't|docs/z.md|R1|' ), unit: 'docs/z.md', path: 'docs/z.md', fix: undefined };

			await writeFiles( checkout, { '.ai-tasks/t/open.json': JSON.stringify( [ fixed, other ] ) } );
			await resolve( { action: 'dismiss', id: idOf( 'docs/a.md', 'R1' ), cwd: checkout } );

			const report = await readText( upath.join( checkout, '.ai-tasks/t/report.md' ) );

			expect( report ).toContain( '(https://github.com/owner/repo/blob/stable/docs/z.md)' );
			expect( report ).not.toContain( '/blob/ai-tasks/' );
		} );

		it( 'falls back to the local base branch', async () => {
			git( checkout, 'update-ref', '-d', 'refs/remotes/origin/stable' );

			await resolve( { action: 'dismiss', id: idOf( 'docs/a.md', 'R1' ), configPath, cwd: checkout } );

			expect( await readText( upath.join( checkout, 'docs/a.md' ) ) ).toBe( 'This is LOCAL.\n' );
		} );

		it( 'throws when the base branch does not exist at all', async () => {
			git( checkout, 'branch', '--quiet', '-m', 'ai-tasks/t/repo/gone' );

			await expect( resolve( { action: 'dismiss', id: idOf( 'docs/a.md', 'R1' ), configPath, cwd: checkout } ) )
				.rejects.toThrow( 'The "gone" base branch of the "ai-tasks/t/repo/gone" report branch does not exist. Fetch it first.' );
			expect( await readText( upath.join( checkout, 'docs/a.md' ) ) ).toBe( 'This is GOOD.\n' );
		} );
	} );

	describe( 'finding the finding', () => {
		beforeEach( writeUnfixedState );

		it( 'accepts a prefix of the ID, in brackets and in any case', async () => {
			const id = idOf( 'docs/a.md', 'R1' );
			const result = await resolve( { action: 'dismiss', id: `[${ id.toUpperCase() }]`, configPath, cwd: root } );

			expect( result.finding.unit ).toBe( 'docs/a.md' );
		} );

		it( 'throws when no open finding has the ID', async () => {
			await expect( resolve( { action: 'dismiss', id: 'zzzzzz', configPath, cwd: root } ) )
				.rejects.toThrow( 'No open finding has the "zzzzzz" ID.' );
			await expect( resolve( { action: 'dismiss', id: '[]', configPath, cwd: root } ) )
				.rejects.toThrow( 'No open finding has the "[]" ID.' );
		} );

		it( 'throws when the ID matches more than one finding and lists them', async () => {
			// With enough findings, two of their IDs start with the same character.
			const units = Array.from( { length: 17 }, ( _, index ) => `docs/u${ index }.md` );
			const findings = units.map( unit => ( {
				fingerprint: `t|${ unit }|R1|${ unit === units[ 0 ] ? 'Intro' : '' }`,
				id: hash( `t|${ unit }|R1|${ unit === units[ 0 ] ? 'Intro' : '' }` ),
				task: 't',
				unit,
				ruleId: 'R1',
				discriminator: unit === units[ 0 ] ? 'Intro' : '',
				detail: 'Bad.',
				fragment: 'x'
			} ) );

			await writeFiles( statePath(), { 'open.json': JSON.stringify( findings ) } );

			const ids = findings.map( finding => hash( finding.fingerprint ) );
			const prefix = ids.find( ( id, index ) => ids.findIndex( other => other[ 0 ] === id[ 0 ] ) !== index )![ 0 ]!;
			const matching = findings.filter( finding => hash( finding.fingerprint ).startsWith( prefix ) );

			await expect( resolve( { action: 'dismiss', id: prefix, configPath, cwd: root } ) ).rejects.toThrow( [
				`The "${ prefix }" ID matches more than one finding. Use more characters of the ID:`,
				...matching.map( finding => `  [${ getFindingId( finding.fingerprint ) }] R1${ finding.discriminator ? ' (Intro)' : '' } in ${ finding.unit } (t)` )
			].join( '\n' ) );
		} );
	} );

	it( 'detects overlapping fixes in a task excluded by the task filter', async () => {
		await writeFiles( root, { 'docs/b.md': 'Fine.\n' } );
		await useConfig( {
			'tasks/t/index.mjs': fixingTask( 't' ),
			'tasks/other/index.mjs': fixingTask( 'other' ).replaceAll( 'BAD', 'GOOD' )
				.replace( '.replace( \'GOOD\', \'GOOD\' )', '.replace( \'GOOD\', \'POLISHED\' )' ),
			'targets/repo.mjs': 'export default { slug: \'owner/repo\', tasks: { t: {}, other: {} } };'
		} );
		await run();

		await expect( resolve( {
			action: 'reject', id: idOf( 'docs/a.md', 'R1' ), reason: 'Fine', configPath, cwd: root, tasks: [ 't' ]
		} ) ).rejects.toThrow( 'Re-run with "--force"' );
		expect( await read( 'docs/a.md' ) ).toBe( 'This is POLISHED.\n' );
	} );

	it( 'accepts an ID prefix longer than the displayed ID', async () => {
		await writeUnfixedState();
		const result = await resolve( {
			action: 'dismiss', id: getFindingId( 't|docs/a.md|R1|' ).slice( 0, 20 ), configPath, cwd: root
		} );

		expect( result.finding.unit ).toBe( 'docs/a.md' );
	} );

	it( 'resolves a finding of a named instance, in the state of the instance', async () => {
		await useConfig( {
			'tasks/t/index.mjs': fixingTask( 't' ),
			'targets/repo.mjs': 'export default { slug: \'owner/repo\', tasks: { t: { enabled: false }, \'t-api\': { task: \'t\' } } };\n'
		} );
		await run();

		const result = await resolve( { action: 'reject', id: idOf( 'docs/a.md', 'R1', 't-api' ), reason: 'Fine.', force: true, configPath, cwd: root } );

		expect( result ).toMatchObject( { finding: { task: 't-api' }, target: 'repo', decisionFile: '.ai-tasks/t-api/decisions/r1-docs-a.yml' } );
		expect( ( await readOpen( 't-api' ) ).map( finding => finding.fingerprint ) ).not.toContain( 't-api|docs/a.md|R1|' );
		expect( await readText( upath.join( statePath( 't-api' ), 'report.md' ) ) ).toContain( '# Task t (t-api)' );
		expect( existsSync( statePath( 't' ) ) ).toBe( false );
	} );

	it( 'uses the selected targets', async () => {
		await writeUnfixedState();
		await useConfig( {
			'tasks/t/index.mjs': fixingTask( 't' ),
			'tasks/quiet/index.mjs': QUIET_TASK,
			'targets/repo.mjs': 'export default { slug: \'owner/repo\', tasks: { t: {} } };\n',
			'targets/other.mjs': 'export default { slug: \'owner/other\', tasks: { quiet: {} } };\n'
		} );
		const result = await resolve( { action: 'dismiss', id: idOf( 'docs/a.md', 'R1' ), targets: [ 'repo' ] } );

		expect( result.target ).toBe( 'repo' );
	} );
} );

describe( 'renderResolvedFinding()', () => {
	const finding = ( overrides: Partial<Finding> = {} ): Finding => ( {
		fingerprint: 't|docs/a.md|R1|',
		id: 'abc123',
		task: 't',
		unit: 'docs/a.md',
		ruleId: 'R1',
		discriminator: '',
		detail: 'Bad.',
		fragment: 'x',
		...overrides
	} );

	const result = ( overrides: Partial<ResolvedFinding> = {} ): ResolvedFinding => ( {
		action: 'reject',
		target: 'repo',
		finding: finding(),
		decisionFile: '.ai-tasks/t/decisions/r1-docs-a.yml',
		revertedFiles: [ 'docs/a.md', 'log.md' ],
		reopened: [],
		...overrides
	} );

	const id = 'abc123';

	it( 'renders a rejection', () => {
		expect( renderResolvedFinding( result() ) ).toBe( [
			`Rejected [${ id }] R1 in docs/a.md (t, repo).`,
			'  Decision  .ai-tasks/t/decisions/r1-docs-a.yml',
			'  Reverted  docs/a.md, log.md',
			'',
			'Nothing was committed. Review the changes with "git diff", then commit them.'
		].join( '\n' ) );
	} );

	it( 'renders a dismissal of a finding without a fix', () => {
		expect( renderResolvedFinding( result( { action: 'dismiss', decisionFile: undefined, revertedFiles: [] } ) ) ).toBe( [
			`Dismissed [${ id }] R1 in docs/a.md (t, repo).`,
			'  Reverted  nothing (the finding had no fix)',
			'',
			'Nothing was committed. Review the changes with "git diff", then commit them.'
		].join( '\n' ) );
	} );

	it( 'lists the reopened findings and shows discriminators', () => {
		const reopened = finding( {
			fingerprint: 'u|docs/b.md|R2|Intro', id: 'def456', task: 'u', unit: 'docs/b.md', ruleId: 'R2', discriminator: 'Intro'
		} );
		const text = renderResolvedFinding( result( { reopened: [ reopened ] } ) );

		expect( text ).toContain( '  Reopened  [def456] R2 (Intro) in docs/b.md (u), fixed again on the next run' );
	} );
} );
