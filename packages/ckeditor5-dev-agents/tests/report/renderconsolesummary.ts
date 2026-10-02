/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect } from 'vitest';
import { renderConsoleSummary } from '../../src/report/renderconsolesummary.js';
import type { TargetResult } from '../../src/runtasks.js';
import type { TaskResult } from '../../src/runner/runtarget.js';
import type { TaskSummary } from '../../src/types.js';

describe( 'renderConsoleSummary()', () => {
	const summary = ( overrides: Partial<TaskSummary> = {} ): TaskSummary => ( {
		task: 'docs-review',
		title: 'Documentation review',
		units: 304,
		changed: 300,
		judged: 299,
		deferred: 0,
		newFindings: 76,
		alreadyOpen: 2,
		rejected: 1,
		fixed: 39,
		discarded: 0,
		changedFiles: 37,
		open: 37,
		errors: 0,
		problems: [],
		cost: 1.234,
		tokens: 5000,
		...overrides
	} );

	const task = ( overrides: Partial<TaskResult> = {} ): TaskResult => ( {
		task: 'docs-review',
		title: 'Documentation review',
		summary: summary(),
		durationMs: 21_800,
		...overrides
	} );

	const target = ( overrides: Partial<TargetResult> = {} ): TargetResult => ( {
		target: 'commercial',
		branch: 'master',
		publish: false,
		results: [ task() ],
		...overrides
	} );

	it( 'renders one block per task of a local run', () => {
		expect( renderConsoleSummary( [ target() ] ) ).toBe( [
			'Documentation review · commercial (master) · local',
			'  Units        304 in scope · 300 changed · 299 judged',
			'  Findings     76 new · 2 already open · 1 rejected',
			'  Fixes        39 fixed · 0 discarded',
			'  Files        37 changed',
			'  Open         37',
			'  Cost         $1.23 · 5000 tokens · 21.8 s',
			'  Problems     none'
		].join( '\n' ) );
	} );

	it( 'names a published run and shows its pull request', () => {
		const text = renderConsoleSummary( [ target( { publish: true, results: [ task( { pullRequestUrl: 'https://pr/1' } ) ] } ) ] );

		expect( text ).toMatch( /^Documentation review · commercial \(master\) · published\n/ );
		expect( text ).toContain( '\n  Pull request https://pr/1' );
	} );

	it( 'shows the units left for the next runs', () => {
		const result = task( { summary: summary( { changed: 304, judged: 100, deferred: 204 } ) } );

		expect( renderConsoleSummary( [ target( { results: [ result ] } ) ] ) )
			.toContain( '\n  Units        304 in scope · 304 changed · 100 judged · 204 left for the next runs\n' );
	} );

	it( 'lists the errors, the discarded fixes and the warnings, each on one line', () => {
		const result = task( {
			summary: summary( {
				errors: 1,
				discarded: 2,
				problems: [
					{ unit: 'docs/a.md', message: 'No API key.\n\nSee the docs.' },
					{ unit: 'docs/b.md', message: 'The fix was discarded. The fix did not resolve any finding.' },
					{ message: 'A skill could not be loaded:\n  missing description.' }
				]
			} )
		} );

		expect( renderConsoleSummary( [ target( { results: [ result ] } ) ] ) ).toContain( [
			'  Fixes        39 fixed · 2 discarded',
			'  Files        37 changed',
			'  Open         37',
			'  Cost         $1.23 · 5000 tokens · 21.8 s',
			'  Problems     3',
			'               • docs/a.md: No API key. See the docs.',
			'               • docs/b.md: The fix was discarded. The fix did not resolve any finding.',
			'               • A skill could not be loaded: missing description.'
		].join( '\n' ) );
	} );

	it( 'renders a failed task with its duration', () => {
		const result = task( {
			summary: undefined,
			failure: 'Merging failed.\nDetails.',
			durationMs: 125_000
		} );

		expect( renderConsoleSummary( [ target( { results: [ result ] } ) ] ) ).toBe( [
			'Documentation review · commercial (master) · local',
			'  Failed       Merging failed. Details.',
			'  Time         2 min 5 s'
		].join( '\n' ) );
	} );

	it( 'shows a publishing failure alongside the completed audit', () => {
		const result = task( { failure: 'API unavailable.' } );
		const text = renderConsoleSummary( [ target( { publish: true, results: [ result ] } ) ] );

		expect( text ).toContain( '299 judged' );
		expect( text ).toContain( '• Publishing failed: API unavailable.' );
	} );

	it( 'renders a failed target and a target without enabled tasks', () => {
		const text = renderConsoleSummary( [
			target( { results: [], error: 'The checkout does not exist.' } ),
			target( { target: 'ckbox', branch: 'main', results: [] } )
		] );

		expect( text ).toBe( [
			'commercial (master) · failed',
			'  Error        The checkout does not exist.',
			'',
			'ckbox (main) · no enabled tasks'
		].join( '\n' ) );
	} );

	it( 'separates the blocks of several tasks with an empty line', () => {
		const text = renderConsoleSummary( [ target( { results: [ task(), task( { title: 'Security review' } ) ] } ) ] );

		expect( text ).toContain( 'Problems     none\n\nSecurity review · commercial (master) · local' );
	} );

	it( 'renders nothing without targets', () => {
		expect( renderConsoleSummary( [] ) ).toBe( '' );
	} );
} );
